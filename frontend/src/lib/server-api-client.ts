/**
 * Server-Side API Client for Next.js App Router (Route Handlers, Server Actions, SSR).
 *
 * SECURITY MANDATES:
 * 1. Executes strictly on the server (Node.js runtime).
 * 2. Reads `INTERNAL_API_KEY` from process.env (NEVER exposed to the browser, no NEXT_PUBLIC_ prefix).
 * 3. Never logs, prints, or returns the API Key in any response or error message.
 * 4. Explicitly forbids calling sensitive n8n publishing endpoints from generic browser proxies.
 */

// List of sensitive endpoints strictly prohibited from browser forwarding (Rule 7)
export const SENSITIVE_ENDPOINTS = [
  "claim-publishing",
  "publish",
  "mark-manual-review",
] as const;

export function isSensitiveEndpoint(path: string): boolean {
  const normalized = path.toLowerCase().replace(/^\/+|\/+$/g, "");
  return SENSITIVE_ENDPOINTS.some(
    (sensitive) =>
      normalized === sensitive ||
      normalized.endsWith(`/${sensitive}`) ||
      normalized.includes(`/${sensitive}/`)
  );
}

export function getServerBackendUrl(): string {
  let base =
    process.env.INTERNAL_BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:3000";

  base = base.replace(/\/+$/, "");

  // Prevent duplicate /api segment
  if (base.endsWith("/api")) {
    base = base.slice(0, -4);
  }

  return base;
}

/**
 * Retrieves the server-side internal API key used for communicating with NestJS Backend.
 * Strictly server-side only. Must be at least 32 characters.
 * Never exposed to browser or client bundle.
 */
export function getInternalApiKey(): string | null {
  const apiKey = process.env.INTERNAL_API_KEY?.trim();
  if (!apiKey || apiKey.length < 32) {
    return null;
  }
  return apiKey;
}

export class ServerApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown,
    public path?: string
  ) {
    // Sanitize message to ensure no secrets or sensitive headers are leaked
    super(`Server API Error [${status} ${statusText}] at ${path}`);
    this.name = "ServerApiError";
  }
}

interface ServerRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  requiresApiKey?: boolean;
}

/**
 * Executes a server-side request to the NestJS backend with optional x-api-key injection.
 */
export async function serverRequest<T>(
  endpointPath: string,
  options: ServerRequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, requiresApiKey } = options;

  // Normalize path
  const cleanPath = endpointPath.startsWith("/")
    ? endpointPath
    : `/${endpointPath}`;
  const apiPath = cleanPath.startsWith("/api/")
    ? cleanPath
    : `/api${cleanPath}`;

  const targetUrl = `${getServerBackendUrl()}${apiPath}`;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...headers,
  };

  // Determine if x-api-key is required (POST, PATCH, PUT, DELETE by default require x-api-key on backend)
  const isMutating = ["POST", "PATCH", "PUT", "DELETE"].includes(method);
  const needsKey = requiresApiKey ?? isMutating;

  if (needsKey) {
    const apiKey = getInternalApiKey();

    if (!apiKey) {
      throw new ServerApiError(
        500,
        "INTERNAL_API_KEY chưa được cấu hình hoặc ngắn hơn 32 ký tự trên server Next.js. Thao tác ghi dữ liệu bị từ chối chuyển tiếp.",
        undefined,
        apiPath
      );
    }

    // Attach x-api-key securely (strictly on server side)
    requestHeaders["x-api-key"] = apiKey;
  }

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new ServerApiError(
      0,
      `Không thể kết nối tới NestJS backend: ${errorMsg}`,
      undefined,
      apiPath
    );
  }

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ServerApiError(
      response.status,
      response.statusText,
      errorData,
      apiPath
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
