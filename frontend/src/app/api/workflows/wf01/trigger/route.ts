import { NextRequest, NextResponse } from "next/server";
import { validateAdminAuth, verifyCsrfOrigin } from "@/lib/admin-auth";
import { TriggerWF01Response } from "@/types/workflow";

export const dynamic = "force-dynamic";

/**
 * Default local n8n WF01 webhook endpoint
 */
const DEFAULT_N8N_WF01_WEBHOOK_URL =
  "http://127.0.0.1:5678/webhook/wf01-generate-content";

/**
 * POST /api/workflows/wf01/trigger
 *
 * Secure server-side trigger for n8n Workflow WF01 (AI Content Generation).
 * - Requires server-side Admin authentication (Cookie session or Bearer/x-admin-key)
 * - Enforces CSRF Origin protection for cookie-based browser sessions
 * - Injects x-webhook-secret securely from server environment
 * - Forwards topic and optional suggestedTitle to n8n webhook
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<TriggerWF01Response>> {
  // 1. Authenticate Admin session
  const auth = await validateAdminAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      {
        success: false,
        error: "ADMIN_AUTH_REQUIRED",
        message:
          auth.reason ||
          "Yêu cầu quyền quản trị viên để kích hoạt workflow sinh nội dung AI.",
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
          message: "Yêu cầu phải có dữ liệu JSON.",
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

  // 4. Validate `topic` (Required, 1-150 characters)
  const topicRaw = payload.topic;
  if (typeof topicRaw !== "string" || !topicRaw.trim()) {
    return NextResponse.json(
      {
        success: false,
        error: "VALIDATION_ERROR",
        message: "Chủ đề (topic) là bắt buộc và không được để trống.",
      },
      { status: 400 }
    );
  }

  const topic = topicRaw.trim();
  if (topic.length > 150) {
    return NextResponse.json(
      {
        success: false,
        error: "VALIDATION_ERROR",
        message: "Chủ đề (topic) không được vượt quá 150 ký tự.",
      },
      { status: 400 }
    );
  }

  // 5. Validate `suggestedTitle` (Optional, max 200 characters)
  let suggestedTitle: string | undefined = undefined;
  if (payload.suggestedTitle !== undefined && payload.suggestedTitle !== null) {
    if (typeof payload.suggestedTitle !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "Tiêu đề gợi ý (suggestedTitle) phải là chuỗi ký tự.",
        },
        { status: 400 }
      );
    }
    const trimmedTitle = payload.suggestedTitle.trim();
    if (trimmedTitle.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "Tiêu đề gợi ý (suggestedTitle) không được vượt quá 200 ký tự.",
        },
        { status: 400 }
      );
    }
    if (trimmedTitle.length > 0) {
      suggestedTitle = trimmedTitle;
    }
  }

  // 6. Verify N8N_WEBHOOK_SECRET is configured
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

  // 7. Resolve target n8n webhook URL (Strictly server-side, never from browser)
  const targetWebhookUrl =
    process.env.N8N_WF01_WEBHOOK_URL?.trim() || DEFAULT_N8N_WF01_WEBHOOK_URL;

  // 8. Prepare outgoing request payload for node `Prepare Topic`
  const outgoingPayload: { topic: string; suggestedTitle?: string } = {
    topic,
    ...(suggestedTitle ? { suggestedTitle } : {}),
  };

  // 9. Execute server-to-server fetch to n8n webhook
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
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: "N8N_CONNECTION_ERROR",
        message: `Không thể kết nối đến máy chủ n8n (${errorMsg}). Vui lòng kiểm tra Docker container n8n có đang chạy không.`,
      },
      { status: 502 }
    );
  }

  // 10. Handle non-2xx n8n responses
  if (!n8nResponse.ok) {
    if (n8nResponse.status === 401 || n8nResponse.status === 403) {
      return NextResponse.json(
        {
          success: false,
          error: "N8N_AUTH_FAILED",
          message:
            "Xác thực với n8n thất bại (x-webhook-secret không hợp lệ hoặc thiếu quyền truy cập webhook).",
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
            "Không tìm thấy Webhook WF01 trong n8n. Vui lòng kiểm tra workflow đã được bật (Active) tại http://localhost:5678.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "N8N_SERVER_ERROR",
        message: `Máy chủ n8n phản hồi lỗi HTTP ${n8nResponse.status}: ${n8nResponse.statusText}.`,
      },
      { status: n8nResponse.status >= 500 ? 502 : n8nResponse.status }
    );
  }

  // 11. Success Response
  // Note: Only confirm that the request was submitted. Do NOT claim the post is already saved to MongoDB,
  // as n8n WF01 executes asynchronously.
  return NextResponse.json(
    {
      success: true,
      message: "Đã gửi yêu cầu tạo bài",
      details:
        "Workflow WF01 đã tiếp nhận yêu cầu và đang sinh nội dung với mô hình Ollama AI (qwen2.5:7b). Quá trình kiểm định y khoa và tạo bản nháp sẽ hoàn tất trong giây lát.",
      topic,
      suggestedTitle,
    },
    { status: 200 }
  );
}
