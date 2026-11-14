import { NextRequest, NextResponse } from "next/server";
import {
  serverRequest,
  ServerApiError,
  isSensitiveEndpoint,
  getInternalApiKey,
} from "@/lib/server-api-client";
import { validateAdminAuth, verifyCsrfOrigin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    path?: string[];
  };
}

/**
 * Extract normalized subpath from route context params
 */
function extractSubpath(context: RouteContext): string {
  const segments = context.params?.path;
  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return "";
  }
  return segments.join("/");
}

/**
 * Handle read-only GET requests:
 * - Block sensitive automated endpoints (403 Forbidden)
 * - Forward safe read endpoints to backend without exposing API key
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const subpath = extractSubpath(context);

  if (isSensitiveEndpoint(subpath)) {
    return NextResponse.json(
      {
        error: "FORBIDDEN_ENDPOINT",
        message:
          "Endpoint này thuộc luồng tự động / nhạy cảm của n8n và bị cấm truy cập từ trình duyệt.",
        endpoint: subpath,
      },
      { status: 403 }
    );
  }

  const search = request.nextUrl.search;
  const targetPath = subpath ? `${subpath}${search}` : search;

  try {
    const data = await serverRequest(targetPath, {
      method: "GET",
      requiresApiKey: false,
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    if (error instanceof ServerApiError) {
      const status = error.status > 0 ? error.status : 503;
      return NextResponse.json(
        error.data || { error: error.message },
        { status }
      );
    }
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Common handler for mutating operations (POST, PATCH, PUT, DELETE):
 * 1. Strictly forbid sensitive automated n8n endpoints (403)
 * 2. Require admin authentication (401) to prevent open public proxies
 * 3. Safely forward authenticated calls attaching INTERNAL_API_KEY server-side
 */
async function handleMutatingRequest(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  request: NextRequest,
  context: RouteContext
) {
  const subpath = extractSubpath(context);

  // 1. Block sensitive endpoints unconditionally
  if (isSensitiveEndpoint(subpath)) {
    return NextResponse.json(
      {
        error: "FORBIDDEN_ENDPOINT",
        message:
          "Endpoint này thuộc luồng tự động / nhạy cảm của n8n và bị cấm truy cập từ trình duyệt.",
        endpoint: subpath,
      },
      { status: 403 }
    );
  }

  // 2. Validate admin authentication before forwarding (verifies HMAC session signature, expiration, role)
  const auth = await validateAdminAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      {
        error: "ADMIN_AUTH_REQUIRED",
        message:
          auth.reason ||
          "Thao tác ghi dữ liệu yêu cầu xác thực quyền quản trị viên (chưa đăng nhập hoặc phiên đã hết hạn).",
        endpoint: subpath,
      },
      { status: 401 }
    );
  }

  // 3. CSRF Protection: For mutating requests authenticated via Cookie, verify Origin/Referer
  if (auth.authMethod === "cookie") {
    const csrf = verifyCsrfOrigin(request);
    if (!csrf.valid) {
      return NextResponse.json(
        {
          error: "CSRF_FORBIDDEN",
          message:
            csrf.reason ||
            "Yêu cầu ghi dữ liệu bị từ chối do không vượt qua kiểm tra chống CSRF (Origin mismatch).",
          endpoint: subpath,
        },
        { status: 403 }
      );
    }
  }

  // 4. Ensure INTERNAL_API_KEY is configured before forwarding to Backend
  const internalApiKey = getInternalApiKey();
  if (!internalApiKey) {
    return NextResponse.json(
      {
        error: "INTERNAL_API_KEY_NOT_CONFIGURED",
        message:
          "Hệ thống chưa cấu hình biến môi trường INTERNAL_API_KEY (tối thiểu 32 ký tự) trên server. Thao tác ghi bị từ chối chuyển tiếp.",
        endpoint: subpath,
      },
      { status: 500 }
    );
  }

  // 3. Safely parse request body
  let body: unknown = undefined;
  try {
    const text = await request.text();
    if (text && text.trim().length > 0) {
      body = JSON.parse(text);
    }
  } catch {
    return NextResponse.json(
      {
        error: "INVALID_JSON",
        message: "Dữ liệu gửi lên không đúng định dạng JSON.",
      },
      { status: 400 }
    );
  }

  const search = request.nextUrl.search;
  const targetPath = subpath ? `${subpath}${search}` : search;

  try {
    const data = await serverRequest(targetPath, {
      method,
      body,
      requiresApiKey: true,
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    if (error instanceof ServerApiError) {
      const status = error.status > 0 ? error.status : 503;
      return NextResponse.json(
        error.data || { error: error.message },
        { status }
      );
    }
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleMutatingRequest("POST", request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleMutatingRequest("PATCH", request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleMutatingRequest("PUT", request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleMutatingRequest("DELETE", request, context);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-key",
    },
  });
}
