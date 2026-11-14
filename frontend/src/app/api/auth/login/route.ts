import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSecret,
  createSessionToken,
  getSessionCookieOptions,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { secret?: string; password?: string; key?: string } = {};

  try {
    const text = await request.text();
    if (text && text.trim().length > 0) {
      body = JSON.parse(text);
    }
  } catch {
    return NextResponse.json(
      { error: "INVALID_JSON", message: "Dữ liệu gửi lên không đúng định dạng JSON." },
      { status: 400 }
    );
  }

  const providedSecret = (body.secret || body.password || body.key || "").trim();

  if (!providedSecret) {
    return NextResponse.json(
      {
        error: "MISSING_CREDENTIALS",
        message: "Vui lòng nhập khóa quản trị viên (ADMIN_SECRET).",
      },
      { status: 400 }
    );
  }

  const adminSecret = getAdminSecret();

  if (!adminSecret) {
    return NextResponse.json(
      {
        error: "SERVER_NOT_CONFIGURED",
        message:
          "Hệ thống chưa cấu hình biến môi trường ADMIN_SECRET (tối thiểu 16 ký tự) trên server. Vui lòng kiểm tra file .env.local.",
      },
      { status: 500 }
    );
  }

  // Constant-time check
  if (providedSecret.length !== adminSecret.length) {
    return NextResponse.json(
      {
        error: "INVALID_CREDENTIALS",
        message: "Khóa quản trị viên không chính xác. Vui lòng thử lại.",
      },
      { status: 401 }
    );
  }

  // Check equality using Web Crypto HMAC
  const enc = new TextEncoder();
  const dummyKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(32),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigA = new Uint8Array(
    await crypto.subtle.sign("HMAC", dummyKey, enc.encode(providedSecret))
  );
  const sigB = new Uint8Array(
    await crypto.subtle.sign("HMAC", dummyKey, enc.encode(adminSecret))
  );

  let diff = 0;
  for (let i = 0; i < sigA.length; i++) {
    diff |= sigA[i] ^ sigB[i];
  }

  if (diff !== 0) {
    return NextResponse.json(
      {
        error: "INVALID_CREDENTIALS",
        message: "Khóa quản trị viên không chính xác. Vui lòng thử lại.",
      },
      { status: 401 }
    );
  }

  // Generate HMAC signed session token (does NOT contain the raw secret)
  const sessionToken = await createSessionToken(adminSecret);
  const cookieOptions = getSessionCookieOptions();

  const response = NextResponse.json({
    success: true,
    message: "Đăng nhập quản trị viên thành công.",
    role: "admin",
  });

  // Attach HttpOnly, SameSite=Lax, Secure session cookie
  response.cookies.set(cookieOptions.name, sessionToken, cookieOptions);

  return response;
}
