import { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "admin_session";
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60; // 24 hours

export interface SessionPayload {
  role: "admin";
  iat: number;
  exp: number;
  nonce: string;
}

/**
 * Base64URL encoding/decoding using standard Web APIs
 * Fully compatible with Node.js 18+, Edge Runtime, and browser environments.
 */
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Constant-time comparison for strings using Web Crypto HMAC
 * Prevents timing attacks on secret comparison across all runtimes.
 */
async function timingSafeEqualString(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) {
    return false;
  }
  const enc = new TextEncoder();
  const dummyKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(32),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigA = new Uint8Array(
    await crypto.subtle.sign("HMAC", dummyKey, enc.encode(a))
  );
  const sigB = new Uint8Array(
    await crypto.subtle.sign("HMAC", dummyKey, enc.encode(b))
  );
  let diff = 0;
  for (let i = 0; i < sigA.length; i++) {
    diff |= sigA[i] ^ sigB[i];
  }
  return diff === 0;
}

/**
 * Retrieves the server-side admin secret.
 * MUST use process.env.ADMIN_SECRET strictly.
 * NO FALLBACK to INTERNAL_API_KEY under any circumstance.
 * Must be at least 16 characters.
 */
export function getAdminSecret(): string | null {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret || secret.length < 16) {
    return null;
  }
  return secret;
}

/**
 * Standard cookie configuration for the admin session
 */
export function getSessionCookieOptions() {
  return {
    name: ADMIN_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/**
 * Creates an HMAC-SHA256 signed session token.
 * Contains: payload base64url + "." + hmac signature base64url.
 * Does NOT contain the raw ADMIN_SECRET.
 */
export async function createSessionToken(secret: string): Promise<string> {
  const now = Date.now();
  const payload: SessionPayload = {
    role: "admin",
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS * 1000,
    nonce: Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  };

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(payloadJson));

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64)
  );

  const signatureB64 = base64UrlEncode(new Uint8Array(signatureBuffer));
  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies an HMAC-SHA256 signed session token.
 * Validates cryptographic signature, expiration timestamp, and admin role.
 */
export async function verifySessionToken(
  token: string,
  secret: string
): Promise<{ valid: boolean; payload?: SessionPayload; reason?: string }> {
  if (!token || typeof token !== "string") {
    return { valid: false, reason: "Thiếu mã phiên đăng nhập." };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "Định dạng mã phiên không hợp lệ." };
  }

  const [payloadB64, signatureB64] = parts;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureBytes = base64UrlDecode(signatureB64);
    const dataBytes = new TextEncoder().encode(payloadB64);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      dataBytes as unknown as BufferSource
    );

    if (!isValid) {
      return {
        valid: false,
        reason: "Chữ ký phiên làm việc không hợp lệ hoặc đã bị can thiệp.",
      };
    }

    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
    const payload = JSON.parse(payloadJson) as SessionPayload;

    if (!payload.exp || payload.exp < Date.now()) {
      return {
        valid: false,
        reason: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.",
      };
    }

    if (payload.role !== "admin") {
      return { valid: false, reason: "Vai trò không có quyền quản trị viên." };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: "Không thể giải mã phiên làm việc." };
  }
}

export interface AdminAuthResult {
  authenticated: boolean;
  authMethod?: "cookie" | "header";
  reason?: string;
}

/**
 * Validates admin authentication for Route Handlers and mutating requests.
 * 
 * Sources checked in priority order:
 * 1. Cookie `admin_session` (Signed HMAC session token) -> authMethod: "cookie"
 * 2. Header `Authorization: Bearer <sessionToken | ADMIN_SECRET>` -> authMethod: "header"
 * 3. Header `x-admin-key: <ADMIN_SECRET>` (Direct API/CLI fallback) -> authMethod: "header"
 */
export async function validateAdminAuth(
  request: NextRequest | Request
): Promise<AdminAuthResult> {
  const secret = getAdminSecret();

  if (!secret) {
    return {
      authenticated: false,
      reason:
        "Hệ thống chưa cấu hình biến môi trường ADMIN_SECRET (tối thiểu 16 ký tự) trên server.",
    };
  }

  // 1. Check HttpOnly cookie `admin_session`
  let cookieToken: string | null = null;
  if ("cookies" in request) {
    cookieToken =
      request.cookies.get(ADMIN_COOKIE_NAME)?.value ||
      request.cookies.get("admin_token")?.value ||
      null;
  } else {
    // Standard Request headers
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(
        new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`)
      );
      if (match) {
        cookieToken = decodeURIComponent(match[1]);
      }
    }
  }

  if (cookieToken) {
    const sessionResult = await verifySessionToken(cookieToken, secret);
    if (sessionResult.valid) {
      return { authenticated: true, authMethod: "cookie" };
    }
  }

  // 2. Check Bearer token (could be signed session token or direct secret)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const bearerValue = authHeader.slice(7).trim();
    if (bearerValue.includes(".")) {
      const sessionResult = await verifySessionToken(bearerValue, secret);
      if (sessionResult.valid) {
        return { authenticated: true, authMethod: "header" };
      }
    } else {
      const isMatch = await timingSafeEqualString(bearerValue, secret);
      if (isMatch) {
        return { authenticated: true, authMethod: "header" };
      }
    }
  }

  // 3. Check x-admin-key header (direct CLI/testing fallback)
  const adminKeyHeader = request.headers.get("x-admin-key");
  if (adminKeyHeader) {
    const isMatch = await timingSafeEqualString(adminKeyHeader.trim(), secret);
    if (isMatch) {
      return { authenticated: true, authMethod: "header" };
    }
  }

  return {
    authenticated: false,
    reason:
      "Chưa đăng nhập quản trị viên hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập tại /login.",
  };
}

/**
 * Checks if a mutating request authenticated via Cookie satisfies CSRF Origin requirements.
 * Compares Origin or Referer against the current server origin / host.
 */
export function verifyCsrfOrigin(request: NextRequest): {
  valid: boolean;
  reason?: string;
} {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host"); // e.g. "localhost:3000"
  const nextOrigin = request.nextUrl.origin; // e.g. "http://localhost:3000"

  // When Origin header is present (standard for browser fetch/xhr mutations)
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.origin === nextOrigin || originUrl.host === host) {
        return { valid: true };
      }
      return {
        valid: false,
        reason:
          "Header Origin không khớp với máy chủ hiện tại (Phát hiện nguy cơ tấn công CSRF).",
      };
    } catch {
      return {
        valid: false,
        reason: "Header Origin có định dạng URL không hợp lệ.",
      };
    }
  }

  // If Origin is not present, fall back to Referer check
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.origin === nextOrigin || refererUrl.host === host) {
        return { valid: true };
      }
      return {
        valid: false,
        reason:
          "Header Referer không khớp với máy chủ hiện tại (Phát hiện nguy cơ tấn công CSRF).",
      };
    } catch {
      return {
        valid: false,
        reason: "Header Referer có định dạng URL không hợp lệ.",
      };
    }
  }

  // For cookie-based mutating requests, browser must provide matching Origin or Referer
  return {
    valid: false,
    reason:
      "Yêu cầu ghi dữ liệu sử dụng phiên Cookie thiếu header Origin hoặc Referer hợp lệ (Bảo vệ chống CSRF).",
  };
}
