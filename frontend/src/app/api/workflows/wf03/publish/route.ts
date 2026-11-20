import { NextRequest, NextResponse } from "next/server";
import { validateAdminAuth, verifyCsrfOrigin } from "@/lib/admin-auth";
import { TriggerWF03PublishResponse } from "@/types/content";

export const dynamic = "force-dynamic";

/**
 * Default local n8n WF03 publish webhook endpoint
 */
const DEFAULT_N8N_WF03_WEBHOOK_URL =
  "http://127.0.0.1:5678/webhook/wf03-publish-content";

/**
 * 24-character hexadecimal MongoDB ObjectId regex
 */
const MONGO_OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function isValidObjectId(id: string): boolean {
  return typeof id === "string" && MONGO_OBJECT_ID_REGEX.test(id.trim());
}

/**
 * POST /api/workflows/wf03/publish
 *
 * Secure server-side trigger for n8n Workflow WF03 (Facebook Publishing via Buffer).
 * 
 * SECURITY MANDATES:
 * 1. Only supports HTTP POST.
 * 2. Authenticates Admin session via validateAdminAuth.
 * 3. Enforces CSRF Origin protection for Cookie-based sessions via verifyCsrfOrigin.
 * 4. Validates contentId strictly as a 24-hex MongoDB ObjectId.
 * 5. Uses server-only N8N_WEBHOOK_SECRET and N8N_WF03_WEBHOOK_URL.
 * 6. Never accepts target webhook URL or secrets from browser client.
 * 7. Enforces request timeout (15s) and connection error handling.
 * 8. Does NOT claim post is published on webhook HTTP 200 (WF03 executes asynchronously).
 * 9. Never automatically retries ambiguous requests to prevent duplicate publishing.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<TriggerWF03PublishResponse>> {
  // 1. Authenticate Admin session
  const auth = await validateAdminAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      {
        success: false,
        error: "ADMIN_AUTH_REQUIRED",
        message:
          auth.reason ||
          "Yêu cầu quyền quản trị viên để thực hiện xuất bản bài viết.",
      },
      { status: 401 }
    );
  }

  // 2. CSRF Origin Protection for Cookie-authenticated browser sessions
  if (auth.authMethod === "cookie") {
    const csrf = verifyCsrfOrigin(request);
    if (!csrf.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "CSRF_FORBIDDEN",
          message:
            csrf.reason ||
            "Yêu cầu bị từ chối do không vượt qua kiểm tra chống CSRF (Origin mismatch).",
        },
        { status: 403 }
      );
    }
  }

  // 3. Parse JSON Body
  let body: unknown;
  try {
    const text = await request.text();
    if (!text || !text.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_BODY",
          message: "Yêu cầu phải có dữ liệu JSON chứa contentId.",
        },
        { status: 400 }
      );
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_JSON",
        message: "Dữ liệu gửi lên không đúng định dạng JSON.",
      },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_BODY",
        message: "Dữ liệu gửi lên phải là một đối tượng JSON hợp lệ.",
      },
      { status: 400 }
    );
  }

  const payload = body as Record<string, unknown>;

  // 4. Validate `contentId` (Required, valid 24-character hexadecimal MongoDB ObjectId)
  const contentIdRaw = payload.contentId;
  if (typeof contentIdRaw !== "string" || !isValidObjectId(contentIdRaw)) {
    return NextResponse.json(
      {
        success: false,
        error: "VALIDATION_ERROR",
        message:
          "ID bài viết (contentId) không hợp lệ (yêu cầu định dạng MongoDB ObjectId 24 ký tự hex).",
      },
      { status: 400 }
    );
  }

  const contentId = contentIdRaw.trim();

  // 5. Verify N8N_WEBHOOK_SECRET is configured on server
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      {
        success: false,
        error: "N8N_SECRET_NOT_CONFIGURED",
        message:
          "Hệ thống chưa cấu hình biến môi trường N8N_WEBHOOK_SECRET trên máy chủ Next.js.",
      },
      { status: 500 }
    );
  }

  // 6. Resolve target n8n webhook URL (Strictly server-side, never from browser)
  const targetWebhookUrl =
    process.env.N8N_WF03_WEBHOOK_URL?.trim() || DEFAULT_N8N_WF03_WEBHOOK_URL;

  // 7. Prepare outgoing request payload for n8n WF03 Webhook
  const outgoingPayload = {
    contentId,
  };

  // 8. Execute server-to-server fetch to n8n webhook with 15s timeout
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 15000);

  let n8nResponse: Response;
  try {
    n8nResponse = await fetch(targetWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-webhook-secret": webhookSecret,
      },
      body: JSON.stringify(outgoingPayload),
      cache: "no-store",
      signal: abortController.signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          error: "N8N_TIMEOUT",
          message:
            "Hết thời gian chờ phản hồi từ máy chủ n8n (Request Timeout 15s). Yêu cầu đã dừng và không tự động gửi lại để ngăn chặn nguy cơ xuất bản trùng lặp.",
        },
        { status: 504 }
      );
    }

    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: "N8N_CONNECTION_ERROR",
        message: `Không thể kết nối đến máy chủ n8n (${errorMsg}). Vui lòng kiểm tra Docker container n8n có đang chạy không.`,
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // 9. Handle non-2xx n8n responses
  if (!n8nResponse.ok) {
    if (n8nResponse.status === 401 || n8nResponse.status === 403) {
      return NextResponse.json(
        {
          success: false,
          error: "N8N_AUTH_FAILED",
          message:
            "Xác thực với n8n thất bại (x-webhook-secret không hợp lệ hoặc thiếu quyền truy cập webhook WF03).",
        },
        { status: n8nResponse.status }
      );
    }

    if (n8nResponse.status === 404) {
      return NextResponse.json(
        {
          success: false,
          error: "N8N_WEBHOOK_NOT_FOUND",
          message:
            "Không tìm thấy Webhook WF03 trên n8n. Vui lòng kiểm tra workflow WF03 đã được cấu hình Webhook Trigger và bật (Active) tại n8n.",
        },
        { status: 404 }
      );
    }

    if (n8nResponse.status === 409) {
      return NextResponse.json(
        {
          success: false,
          error: "CONTENT_CONFLICT",
          message:
            "Bài viết không đủ điều kiện xuất bản hoặc đang được tiến trình khác xử lý (Ngăn chặn xung đột đăng trùng).",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "N8N_SERVER_ERROR",
        message: `Máy chủ n8n phản hồi lỗi HTTP ${n8nResponse.status}: ${n8nResponse.statusText}. Không tự động thử lại yêu cầu.`,
      },
      { status: n8nResponse.status >= 500 ? 502 : n8nResponse.status }
    );
  }

  // 10. Success Response (Asynchronous submission acknowledgement)
  // NOTE: Only confirm that the publishing workflow request was accepted by n8n WF03.
  // Do NOT claim the post is published to Facebook / Buffer yet, as WF03 processes asynchronously.
  return NextResponse.json(
    {
      success: true,
      message: "Đã gửi yêu cầu xuất bản bài viết",
      details:
        "Workflow WF03 đã tiếp nhận yêu cầu xuất bản cho bài viết. Quy trình sẽ thực hiện khóa bài nguyên tử (claim-publishing), gửi qua Buffer và cập nhật trạng thái khi hoàn tất. Vui lòng theo dõi trạng thái bài viết trên danh sách.",
      contentId,
    },
    { status: 200 }
  );
}
