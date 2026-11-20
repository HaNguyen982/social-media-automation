import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date string to Vietnamese localized format
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format relative time in Vietnamese (e.g. 5 phút trước, 2 giờ trước)
 */
export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Vừa xong";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} ngày trước`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

/**
 * Format Vietnamese content status labels
 */
export function getContentStatusBadge(status: string) {
  switch (status) {
    case "PENDING_REVIEW":
      return {
        label: "Chờ phê duyệt",
        variant: "warning" as const,
        badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      };
    case "APPROVED":
      return {
        label: "Đã duyệt",
        variant: "success" as const,
        badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    case "PUBLISHING":
      return {
        label: "Đang xuất bản",
        variant: "info" as const,
        badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      };
    case "PUBLISHED":
      return {
        label: "Đã đăng",
        variant: "info" as const,
        badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      };
    case "REJECTED":
      return {
        label: "Từ chối",
        variant: "destructive" as const,
        badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      };
    default:
      return {
        label: status,
        variant: "neutral" as const,
        badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
      };
  }
}

/**
 * Format Review Status from NestJS backend
 */
export function getReviewStatusBadge(reviewStatus?: string) {
  switch (reviewStatus) {
    case "HUMAN_APPROVED":
      return {
        label: "BS Đã ký duyệt",
        badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
      };
    case "HUMAN_REJECTED":
      return {
        label: "BS Đã từ chối",
        badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800",
      };
    case "NOT_REVIEWED":
      return {
        label: "Chưa kiểm tra",
        badgeClass: "bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-slate-300 dark:border-slate-800",
      };
    default:
      return {
        label: reviewStatus || "Chờ xử lý",
        badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800",
      };
  }
}

/**
 * Format Medical Review Decision in Vietnamese
 */
export function getMedicalReviewBadge(decision?: string) {
  switch (decision) {
    case "APPROVED":
      return {
        label: "Chuẩn y khoa",
        variant: "success" as const,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      };
    case "NEEDS_REVIEW":
      return {
        label: "Cần BS xem lại",
        variant: "warning" as const,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
      };
    case "REJECTED":
      return {
        label: "Sai lệch y khoa",
        variant: "destructive" as const,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
      };
    default:
      return {
        label: "Chưa kiểm định",
        variant: "neutral" as const,
        badgeClass: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
      };
  }
}

/**
 * Format Reconciliation Status (Trạng thái đối soát xuất bản Facebook/Buffer)
 */
export function getReconciliationBadge(status?: string) {
  switch (status) {
    case "PENDING":
      return {
        label: "Đang chờ xác minh",
        badgeClass:
          "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        description: "Đang chờ xác minh kết quả đăng bài từ Buffer.",
      };
    case "NEEDS_MANUAL_REVIEW":
      return {
        label: "Cần kiểm tra kết quả Buffer/Facebook",
        badgeClass:
          "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40",
        description:
          "Có sự cố hoặc phản hồi không rõ ràng từ Buffer/Facebook, cần người quản trị đối soát thủ công.",
      };
    case "CONFIRMED":
      return {
        label: "Đối soát thành công",
        badgeClass:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        description: "Đã xác nhận bài viết xuất bản thành công trên Facebook.",
      };
    case "NOT_REQUIRED":
    default:
      return {
        label: "Không cần đối soát",
        badgeClass:
          "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
        description: "Chưa kích hoạt hoặc không yêu cầu đối soát.",
      };
  }
}
