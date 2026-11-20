import { apiClient, ApiError } from "@/lib/api-client";
import {
  ContentItem,
  ContentStatus,
  ReconciliationStatus,
  CreateContentInput,
  ReviewContentInput,
  PublishContentInput,
  TriggerWF03PublishResponse,
} from "@/types/content";
import { MOCK_CONTENTS } from "@/data/mock/mock-contents";

// In-memory cache for mock state mutations only used when NEXT_PUBLIC_USE_MOCK is explicitly true
let memoryMockContents: ContentItem[] = [...MOCK_CONTENTS];

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK === "true";
}

export interface ContentFetchResult {
  data: ContentItem[];
  error?: string | null;
  isMock: boolean;
}

export const contentsService = {
  /**
   * Get all content items, with optional status filter.
   * If USE_MOCK is false, calls the real NestJS API.
   * NEVER silently falls back to mock data if the real API fails.
   */
  async getContents(status?: ContentStatus): Promise<ContentItem[]> {
    if (isMockMode()) {
      return status
        ? memoryMockContents.filter((item) => item.status === status)
        : [...memoryMockContents];
    }

    // Call real API - throws ApiError if unreachable
    return await apiClient.contents.getAll(status);
  },

  /**
   * Safe fetcher for Server and Client Components to easily display error states
   */
  async getContentsSafe(status?: ContentStatus): Promise<ContentFetchResult> {
    if (isMockMode()) {
      const filtered = status
        ? memoryMockContents.filter((item) => item.status === status)
        : [...memoryMockContents];
      return { data: filtered, error: null, isMock: true };
    }

    try {
      const data = await apiClient.contents.getAll(status);
      return { data, error: null, isMock: false };
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.statusText || err.message
          : err instanceof Error
          ? err.message
          : "Không thể kết nối đến máy chủ NestJS tại http://localhost:3000";
      return { data: [], error: message, isMock: false };
    }
  },

  /**
   * Get a single content item by ID
   */
  async getContentById(id: string): Promise<ContentItem | null> {
    if (isMockMode()) {
      return memoryMockContents.find((item) => item._id === id) || null;
    }

    return await apiClient.contents.getById(id);
  },

  /**
   * Create a new content item
   */
  async createContent(input: CreateContentInput): Promise<ContentItem> {
    if (isMockMode()) {
      const newItem: ContentItem = {
        _id: `content-${Date.now().toString(16)}`,
        title: input.title,
        topic: input.topic,
        body: input.body,
        sourceUrls: input.sourceUrls || [],
        status: input.status || ContentStatus.PENDING_REVIEW,
        medicalReview: input.medicalReview,
        reviewStatus: input.reviewStatus || "PENDING",
        requiresHumanReview: input.requiresHumanReview ?? true,
        reviewMessage: input.reviewMessage || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryMockContents.unshift(newItem);
      return newItem;
    }

    return await apiClient.contents.create(input);
  },

  /**
   * Approve a content item (PATCH /api/contents/:id/approve)
   */
  async approveContent(
    id: string,
    input: ReviewContentInput = {}
  ): Promise<ContentItem> {
    if (isMockMode()) {
      const index = memoryMockContents.findIndex((c) => c._id === id);
      if (index !== -1) {
        memoryMockContents[index] = {
          ...memoryMockContents[index],
          status: ContentStatus.APPROVED,
          reviewer: input.reviewer || "Bác sĩ Phụ trách",
          reviewMessage: input.reviewMessage || "Đã phê duyệt đạt chuẩn",
          reviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return memoryMockContents[index];
      }
      throw new Error(`Mock item not found with id ${id}`);
    }

    return await apiClient.contents.approve(id, input);
  },

  /**
   * Reject a content item (PATCH /api/contents/:id/reject)
   */
  async rejectContent(
    id: string,
    input: ReviewContentInput = {}
  ): Promise<ContentItem> {
    if (isMockMode()) {
      const index = memoryMockContents.findIndex((c) => c._id === id);
      if (index !== -1) {
        memoryMockContents[index] = {
          ...memoryMockContents[index],
          status: ContentStatus.REJECTED,
          reviewer: input.reviewer || "Bác sĩ Phụ trách",
          reviewMessage: input.reviewMessage || "Từ chối: Chưa đạt yêu cầu",
          reviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return memoryMockContents[index];
      }
      throw new Error(`Mock item not found with id ${id}`);
    }

    return await apiClient.contents.reject(id, input);
  },

  /**
   * Publish a content item (PATCH /api/contents/:id/publish)
   */
  async publishContent(
    id: string,
    input: PublishContentInput
  ): Promise<ContentItem> {
    if (isMockMode()) {
      const index = memoryMockContents.findIndex((c) => c._id === id);
      if (index !== -1) {
        memoryMockContents[index] = {
          ...memoryMockContents[index],
          status: ContentStatus.PUBLISHED,
          facebookPostId: input.facebookPostId,
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return memoryMockContents[index];
      }
      throw new Error(`Mock item not found with id ${id}`);
    }

    return await apiClient.contents.publish(id, input);
  },

  /**
   * Triggers the n8n WF03 Facebook publishing workflow for an approved content item.
   * Calls the secure internal Next.js Route Handler /api/workflows/wf03/publish.
   */
  async triggerPublishFacebook(
    contentId: string
  ): Promise<TriggerWF03PublishResponse> {
    if (isMockMode()) {
      const index = memoryMockContents.findIndex((c) => c._id === contentId);
      if (index !== -1) {
        memoryMockContents[index] = {
          ...memoryMockContents[index],
          status: ContentStatus.PUBLISHING,
          reconciliationStatus: ReconciliationStatus.PENDING,
          reconciliationNote:
            "Đang chờ xác minh kết quả đăng bài từ Buffer (Dữ liệu mô phỏng).",
          updatedAt: new Date().toISOString(),
        };
        return {
          success: true,
          message: "Đã tiếp nhận yêu cầu xuất bản (Dữ liệu mô phỏng)",
          details:
            "Chế độ mô phỏng: Thao tác này chỉ cập nhật bộ nhớ tạm Mock data, tuyệt đối không gửi bài viết thật đến n8n hoặc Buffer.",
          contentId,
        };
      }
      throw new Error(`Không tìm thấy bài viết mô phỏng với ID: ${contentId}`);
    }

    const response = await fetch("/api/workflows/wf03/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contentId }),
    });

    let data: TriggerWF03PublishResponse;
    try {
      data = await response.json();
    } catch {
      throw new Error(
        `Không thể phân tích phản hồi từ máy chủ (HTTP ${response.status})`
      );
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          `Kích hoạt xuất bản WF03 thất bại (HTTP ${response.status})`
      );
    }

    return data;
  },
};
