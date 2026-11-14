import {
  ContentItem,
  ContentStatus,
  CreateContentInput,
  ReviewContentInput,
  PublishContentInput,
} from "@/types/content";
import {
  PublishingLogItem,
  CreatePublishingLogInput,
} from "@/types/publishing-log";

/**
 * Base URL for the NestJS Backend API
 * Strips any trailing slash or duplicate /api segment
 */
export function getBackendBaseUrl(): string {
  let base =
    process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ||
    "http://localhost:3000";

  // If user passed http://localhost:3000/api, strip trailing /api so endpoints like /api/contents
  // do not become http://localhost:3000/api/api/contents
  if (base.endsWith("/api")) {
    base = base.slice(0, -4);
  }

  return base;
}

/**
 * Resolves full URL for API requests.
 * - In the browser: uses Next.js proxy rewrite `/api/backend/*` to prevent CORS blockage
 *   since the NestJS backend does not enable CORS headers by default.
 * - On the server (Server Components / SSR): calls backend directly via getBackendBaseUrl().
 */
export function buildApiUrl(endpointPath: string): string {
  const cleanPath = endpointPath.startsWith("/")
    ? endpointPath
    : `/${endpointPath}`;

  // Ensure path starts with /api
  const apiPath = cleanPath.startsWith("/api/")
    ? cleanPath
    : `/api${cleanPath}`;

  if (typeof window !== "undefined") {
    // Client-side in browser: route through Next.js rewrite proxy to avoid browser CORS errors
    const subPath = apiPath.replace(/^\/api/, "");
    return `/api/backend${subPath}`;
  }

  // Server-side (Node.js SSR): direct HTTP call
  return `${getBackendBaseUrl()}${apiPath}`;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown,
    public url?: string
  ) {
    super(
      `API Error [${status} ${statusText}] at ${url}: ${
        typeof data === "string" ? data : JSON.stringify(data)
      }`
    );
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(path);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      cache: "no-store", // Always fetch fresh data from backend
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new ApiError(
      0,
      `Không thể kết nối đến máy chủ Backend (${errorMsg})`,
      { originalError: errorMsg },
      url
    );
  }

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, response.statusText, errorData, url);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Centralized API Client strictly mapped to the NestJS backend controllers:
 * - HealthController (/api/health)
 * - ContentsController (/api/contents)
 * - PublishingLogsController (/api/publishing-logs)
 *
 * NOTE: NEVER invent endpoints here. All methods strictly match backend controllers.
 */
export const apiClient = {
  /**
   * GET /api/health
   */
  async checkHealth(): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    return request<{
      success: boolean;
      message: string;
      timestamp: string;
    }>("/api/health", { method: "GET" });
  },

  /**
   * Contents Endpoints
   */
  contents: {
    /**
     * GET /api/contents?status=...
     */
    async getAll(status?: ContentStatus): Promise<ContentItem[]> {
      const query = status ? `?status=${encodeURIComponent(status)}` : "";
      return request<ContentItem[]>(`/api/contents${query}`, {
        method: "GET",
      });
    },

    /**
     * GET /api/contents/:id
     */
    async getById(id: string): Promise<ContentItem> {
      return request<ContentItem>(`/api/contents/${encodeURIComponent(id)}`, {
        method: "GET",
      });
    },

    /**
     * POST /api/contents
     */
    async create(dto: CreateContentInput): Promise<ContentItem> {
      return request<ContentItem>("/api/contents", {
        method: "POST",
        body: JSON.stringify(dto),
      });
    },

    /**
     * PATCH /api/contents/:id/approve
     */
    async approve(
      id: string,
      dto: ReviewContentInput = {}
    ): Promise<ContentItem> {
      return request<ContentItem>(
        `/api/contents/${encodeURIComponent(id)}/approve`,
        {
          method: "PATCH",
          body: JSON.stringify(dto),
        }
      );
    },

    /**
     * PATCH /api/contents/:id/reject
     */
    async reject(
      id: string,
      dto: ReviewContentInput = {}
    ): Promise<ContentItem> {
      return request<ContentItem>(
        `/api/contents/${encodeURIComponent(id)}/reject`,
        {
          method: "PATCH",
          body: JSON.stringify(dto),
        }
      );
    },

    /**
     * PATCH /api/contents/:id/publish
     */
    async publish(
      id: string,
      dto: PublishContentInput
    ): Promise<ContentItem> {
      return request<ContentItem>(
        `/api/contents/${encodeURIComponent(id)}/publish`,
        {
          method: "PATCH",
          body: JSON.stringify(dto),
        }
      );
    },
  },

  /**
   * Publishing Logs Endpoints
   */
  publishingLogs: {
    /**
     * POST /api/publishing-logs
     */
    async create(dto: CreatePublishingLogInput): Promise<PublishingLogItem> {
      return request<PublishingLogItem>("/api/publishing-logs", {
        method: "POST",
        body: JSON.stringify(dto),
      });
    },
  },
};
