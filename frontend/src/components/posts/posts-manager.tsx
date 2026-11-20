"use client";

import { useState, useEffect } from "react";
import {
  ContentItem,
  ContentStatus,
  ReconciliationStatus,
} from "@/types/content";
import { contentsService } from "@/services/contents.service";
import {
  getContentStatusBadge,
  getMedicalReviewBadge,
  getReviewStatusBadge,
  getReconciliationBadge,
  formatDate,
  formatRelativeTime,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  Check,
  X,
  ShieldCheck,
  AlertTriangle,
  Server,
  AlertCircle,
  ExternalLink,
  UserCheck,
  Workflow,
  Info,
  Share2,
  Loader2,
} from "lucide-react";

interface PostsManagerProps {
  initialPosts?: ContentItem[];
  initialError?: string | null;
}

export function PostsManager({
  initialPosts = [],
  initialError = null,
}: PostsManagerProps) {
  const [posts, setPosts] = useState<ContentItem[]>(initialPosts);
  const [error, setError] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPost, setSelectedPost] = useState<ContentItem | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionWarning, setActionWarning] = useState<string | null>(null);

  // Confirmation dialog state for Approve, Reject, and Publish actions
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject" | "publish";
    post: ContentItem;
  } | null>(null);

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await contentsService.getContents();
      setPosts(res);
      // Synchronize selectedPost if currently open
      if (selectedPost) {
        const found = res.find((p) => p._id === selectedPost._id);
        if (found) setSelectedPost(found);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể kết nối đến máy chủ NestJS tại http://localhost:3000";
      setError(msg);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If no initial posts and no initial error, fetch on client
    if (initialPosts.length === 0 && !initialError) {
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPosts.length, initialError]);

  /**
   * Determine whether a post is eligible for publishing via WF03:
   * - Must have ContentStatus.APPROVED
   * - Must not have reconciliationStatus === NEEDS_MANUAL_REVIEW or PENDING
   * - Must not require human review (requiresHumanReview === false or falsy)
   * - If reviewStatus is present, must be 'HUMAN_APPROVED'
   * - If medicalReview.decision is present, must be 'APPROVED'
   * - Must not already have facebookPostId or publishedAt
   */
  const isPostEligibleForPublish = (post: ContentItem): boolean => {
    if (post.status !== ContentStatus.APPROVED) return false;
    if (
      post.reconciliationStatus === ReconciliationStatus.NEEDS_MANUAL_REVIEW ||
      post.reconciliationStatus === ReconciliationStatus.PENDING
    ) {
      return false;
    }
    if (post.requiresHumanReview === true) return false;
    if (post.reviewStatus && post.reviewStatus !== "HUMAN_APPROVED") return false;
    if (post.medicalReview?.decision && post.medicalReview.decision !== "APPROVED") return false;
    if (post.facebookPostId || post.publishedAt) return false;
    return true;
  };

  const executeApprove = async (id: string) => {
    try {
      setProcessingId(id);
      setActionWarning(null);
      const updated = await contentsService.approveContent(id, {
        reviewer: "HUMAN_REVIEWER",
        reviewMessage: "Đã phê duyệt đạt tiêu chuẩn y tế & sẵn sàng cho WF03 xuất bản.",
      });
      setPosts((prev) => prev.map((p) => (p._id === id ? updated : p)));
      if (selectedPost?._id === id) setSelectedPost(updated);
      setActionSuccess(`Đã phê duyệt bài viết ${id.slice(-6)} thành công! Bài viết đã đủ điều kiện cho n8n WF03.`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác phê duyệt thất bại";
      alert(msg);
    } finally {
      setProcessingId(null);
      setConfirmAction(null);
    }
  };

  const executeReject = async (id: string) => {
    try {
      setProcessingId(id);
      setActionWarning(null);
      const updated = await contentsService.rejectContent(id, {
        reviewer: "HUMAN_REVIEWER",
        reviewMessage: "Từ chối: Chưa đạt tiêu chuẩn lâm sàng hoặc thiếu cảnh báo.",
      });
      setPosts((prev) => prev.map((p) => (p._id === id ? updated : p)));
      if (selectedPost?._id === id) setSelectedPost(updated);
      setActionSuccess(`Đã từ chối bài viết ${id.slice(-6)}.`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác từ chối thất bại";
      alert(msg);
    } finally {
      setProcessingId(null);
      setConfirmAction(null);
    }
  };

  const executePublish = async (id: string) => {
    try {
      setProcessingId(id);
      setActionWarning(null);
      const res = await contentsService.triggerPublishFacebook(id);

      // Do NOT optimistically update status to PUBLISHED or PUBLISHING.
      // Show notification received from server endpoint.
      setActionSuccess(
        res.message || "Yêu cầu xuất bản đã được tiếp nhận bởi WF03. Đang đồng bộ trạng thái..."
      );
      setTimeout(() => setActionSuccess(null), 7000);

      // Close confirmation dialog immediately after submission
      setConfirmAction(null);

      // Reload posts from real Backend to reflect actual database state
      await fetchPosts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác gửi yêu cầu xuất bản thất bại.";
      setActionWarning(
        `Lỗi gửi xuất bản: ${msg}. Vui lòng bấm nút "Làm mới" để kiểm tra trạng thái thực tế của bài viết. Không gửi lại liên tục để tránh trùng lặp bài đăng!`
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Filter posts based on Tab and Search query
  const filteredPosts = posts.filter((post) => {
    const matchesTab =
      activeTab === "ALL"
        ? true
        : activeTab === "NEEDS_MANUAL_REVIEW"
          ? post.reconciliationStatus === ReconciliationStatus.NEEDS_MANUAL_REVIEW
          : post.status === activeTab;

    const matchesSearch =
      searchQuery.trim() === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post._id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const tabCounts = {
    ALL: posts.length,
    PENDING_REVIEW: posts.filter((p) => p.status === ContentStatus.PENDING_REVIEW).length,
    APPROVED: posts.filter((p) => p.status === ContentStatus.APPROVED).length,
    PUBLISHING: posts.filter((p) => p.status === ContentStatus.PUBLISHING).length,
    REJECTED: posts.filter((p) => p.status === ContentStatus.REJECTED).length,
    PUBLISHED: posts.filter((p) => p.status === ContentStatus.PUBLISHED).length,
    NEEDS_MANUAL_REVIEW: posts.filter(
      (p) => p.reconciliationStatus === ReconciliationStatus.NEEDS_MANUAL_REVIEW
    ).length,
  };

  const tabsList = [
    { key: "ALL", label: "Tất cả" },
    { key: ContentStatus.PENDING_REVIEW, label: "Chờ duyệt" },
    { key: ContentStatus.APPROVED, label: "Đã duyệt" },
    { key: ContentStatus.PUBLISHING, label: "Đang xuất bản" },
    { key: ContentStatus.PUBLISHED, label: "Đã đăng" },
    { key: ContentStatus.REJECTED, label: "Từ chối" },
    ...(tabCounts.NEEDS_MANUAL_REVIEW > 0
      ? [{ key: "NEEDS_MANUAL_REVIEW", label: "Cần đối soát" }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Quản Lý Bài Viết
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Dữ liệu trực tiếp từ NestJS Backend API (`/api/contents`) • Giám sát thẩm định y khoa & điều phối xuất bản WF03
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs px-2.5 py-1 gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
          >
            <Server className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>NestJS API: http://localhost:3000</span>
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchPosts}
            disabled={isLoading}
            className="text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Warning / Error Recovery Notification */}
      {actionWarning && (
        <div className="p-3.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-amber-950 dark:text-amber-100">Cảnh báo gửi yêu cầu:</p>
            <p className="leading-relaxed">{actionWarning}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-1 -mt-1 text-amber-700 hover:text-amber-900 dark:text-amber-300"
            onClick={() => setActionWarning(null)}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Error Banner when Backend is unreachable */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">
                Không thể kết nối đến máy chủ NestJS REST API
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                Chi tiết lỗi: <span className="font-mono">{error}</span>
              </p>
              <div className="pt-2 text-xs space-y-1 text-rose-800 dark:text-rose-300">
                <p className="font-medium">Hướng dẫn kiểm tra:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Xác nhận backend NestJS đang chạy trên cổng 3000 (`social-media-content-api`).</li>
                  <li>Xác nhận MongoDB đang hoạt động bình thường.</li>
                  <li>Xác nhận cấu hình `NEXT_PUBLIC_API_URL=http://localhost:3000` trong `.env.local`.</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 pl-8">
            <Button
              size="sm"
              variant="destructive"
              onClick={fetchPosts}
              disabled={isLoading}
              className="text-xs h-8"
            >
              <RefreshCw className={`w-3 h-3 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              Thử kết nối lại
            </Button>
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {tabsList.map((tab) => {
                const count = tabCounts[tab.key as keyof typeof tabCounts] ?? 0;
                const isSelected = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-background text-muted-foreground"
                        }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm tiêu đề, chủ đề, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card className="shadow-sm">
        <CardHeader className="py-3 px-6 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Danh Sách Bản Ghi Bài Viết ({filteredPosts.length})
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Lọc theo: {activeTab === "ALL" ? "Toàn bộ" : activeTab}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs font-semibold">ID & Tiêu đề bài viết</TableHead>
                <TableHead className="text-xs font-semibold hidden md:table-cell">Chủ đề</TableHead>
                <TableHead className="text-xs font-semibold">Thẩm định Y khoa</TableHead>
                <TableHead className="text-xs font-semibold">Kiểm duyệt</TableHead>
                <TableHead className="text-xs font-semibold">Trạng thái</TableHead>
                <TableHead className="text-xs font-semibold">Thời gian</TableHead>
                <TableHead className="text-xs font-semibold text-right pr-6">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* 3-Row Skeleton Loader during Loading */}
              {isLoading && (
                <>
                  {[1, 2, 3].map((idx) => (
                    <TableRow key={`skeleton-${idx}`} className="animate-pulse">
                      <TableCell className="max-w-[320px]">
                        <div className="space-y-2 py-1">
                          <div className="h-4 bg-muted/70 rounded w-4/5" />
                          <div className="h-3 bg-muted/50 rounded w-1/2" />
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="h-4 bg-muted/60 rounded w-24" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 bg-muted/60 rounded-full w-28" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 bg-muted/60 rounded w-24" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 bg-muted/60 rounded-full w-20" />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="h-3 bg-muted/60 rounded w-16" />
                          <div className="h-3 bg-muted/40 rounded w-12" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1.5">
                          <div className="h-7 w-7 bg-muted/60 rounded" />
                          <div className="h-7 w-20 bg-muted/60 rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}

              {/* Data Rows when not loading */}
              {!isLoading && filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-sm text-muted-foreground"
                  >
                    {error
                      ? "Không thể hiển thị dữ liệu do lỗi kết nối Backend."
                      : "Không tìm thấy bài viết nào phù hợp với bộ lọc hiện tại."}
                  </TableCell>
                </TableRow>
              ) : (
                !isLoading &&
                filteredPosts.map((post) => {
                  const statusMeta = getContentStatusBadge(post.status);
                  const medMeta = getMedicalReviewBadge(post.medicalReview?.decision);
                  const reviewMeta = getReviewStatusBadge(post.reviewStatus);
                  const reconMeta = getReconciliationBadge(post.reconciliationStatus);
                  const isBusy = processingId === post._id;
                  const isPublishEligible = isPostEligibleForPublish(post);

                  return (
                    <TableRow key={post._id} className="hover:bg-muted/30">
                      {/* Title & Mongo ID */}
                      <TableCell className="max-w-[320px]">
                        <div className="flex flex-col">
                          <span
                            className="font-medium text-xs sm:text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
                            onClick={() => setSelectedPost(post)}
                            title={post.title}
                          >
                            {post.title}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span className="text-slate-400">ID:</span> {post._id}
                          </span>
                        </div>
                      </TableCell>

                      {/* Topic */}
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] hidden md:table-cell">
                        <span className="truncate block font-medium">
                          {post.topic}
                        </span>
                      </TableCell>

                      {/* Medical Review */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${medMeta.badgeClass}`}
                        >
                          {post.medicalReview?.decision === "APPROVED" ? (
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                          )}
                          {medMeta.label}
                        </span>
                      </TableCell>

                      {/* Review Status from Doctor */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded border ${reviewMeta.badgeClass}`}
                        >
                          {reviewMeta.label}
                        </span>
                      </TableCell>

                      {/* Content Status & Reconciliation Badge */}
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge
                            variant="outline"
                            className={`text-[11px] border ${statusMeta.badgeClass}`}
                          >
                            {statusMeta.label}
                          </Badge>
                          {post.reconciliationStatus &&
                            post.reconciliationStatus !== ReconciliationStatus.NOT_REQUIRED && (
                              <span
                                className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${reconMeta.badgeClass}`}
                                title={reconMeta.description}
                              >
                                {reconMeta.label}
                              </span>
                            )}
                        </div>
                      </TableCell>

                      {/* Created / Reviewed Date */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex flex-col text-[11px]">
                          <span>{formatDate(post.createdAt)}</span>
                          <span className="text-slate-400">
                            {formatRelativeTime(post.createdAt)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setSelectedPost(post)}
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {/* Approve Action with Confirmation */}
                          {post.status !== ContentStatus.APPROVED &&
                            post.status !== ContentStatus.PUBLISHED &&
                            post.status !== ContentStatus.PUBLISHING && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => setConfirmAction({ type: "approve", post })}
                                className="h-8 px-2 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                title="Phê duyệt bài viết (yêu cầu xác nhận)"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Duyệt
                              </Button>
                            )}

                          {/* Reject Action with Confirmation */}
                          {post.status !== ContentStatus.REJECTED &&
                            post.status !== ContentStatus.PUBLISHED &&
                            post.status !== ContentStatus.PUBLISHING && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => setConfirmAction({ type: "reject", post })}
                                className="h-8 px-2 text-xs border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Từ chối bài viết (yêu cầu xác nhận)"
                              >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Hủy
                              </Button>
                            )}

                          {/* Publish Facebook Button for APPROVED posts */}
                          {post.status === ContentStatus.APPROVED && (
                            <>
                              {isPublishEligible ? (
                                <Button
                                  variant="default"
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() => setConfirmAction({ type: "publish", post })}
                                  className="h-8 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs gap-1.5"
                                  title="Gửi bài viết đến quy trình WF03 để đăng lên Fanpage Vitamin Sức Khỏe"
                                >
                                  {isBusy ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Share2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>Đăng Facebook</span>
                                </Button>
                              ) : post.reconciliationStatus ===
                                ReconciliationStatus.NEEDS_MANUAL_REVIEW ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                                  title="Bài viết đang ở trạng thái Cần đối soát Buffer. Vui lòng kiểm tra Fanpage trước khi thực hiện thao tác."
                                >
                                  <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span>Cần đối soát</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                                  title="Bài viết chưa đáp ứng toàn bộ điều kiện duyệt y khoa hoặc đang chờ xác nhận."
                                >
                                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span>Chưa đủ điều kiện</span>
                                </span>
                              )}
                            </>
                          )}

                          {/* Status indicator for PUBLISHING posts */}
                          {post.status === ContentStatus.PUBLISHING && (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20"
                              title="Bài viết đang được n8n WF03 khóa nguyên tử và xử lý đăng Buffer."
                            >
                              <RefreshCw className="w-3 h-3 text-cyan-600 animate-spin shrink-0" />
                              <span>WF03 đang xử lý</span>
                            </span>
                          )}

                          {/* Status indicator for PUBLISHED posts */}
                          {post.status === ContentStatus.PUBLISHED && (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                              title="Bài viết đã được đăng thành công lên Facebook Fanpage."
                            >
                              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Đã xuất bản</span>
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Approve / Reject / Publish Actions */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && !processingId && setConfirmAction(null)}
      >
        {confirmAction && (
          <div className="space-y-4">
            {confirmAction.type === "publish" ? (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-full bg-blue-500/10 text-blue-600">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <DialogTitle className="text-base sm:text-lg">
                      Xác Nhận Đăng Bài Lên Facebook Fanpage
                    </DialogTitle>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Bạn đang kích hoạt điều phối xuất bản tự động qua quy trình n8n WF03.
                  </DialogDescription>
                </DialogHeader>

                {/* Target Post Summary */}
                <div className="p-3.5 rounded-lg border border-border bg-muted/40 space-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Tiêu đề bài viết:</span>
                    <span className="font-semibold text-foreground text-sm leading-snug">
                      {confirmAction.post.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 pt-1.5 border-t border-border/60 text-muted-foreground">
                    <span>
                      ID bài viết: <code className="font-mono text-foreground font-medium">{confirmAction.post._id}</code>
                    </span>
                    <span>
                      Chủ đề: <span className="font-medium text-foreground">{confirmAction.post.topic}</span>
                    </span>
                  </div>
                </div>

                {/* Destination and Workflow Info */}
                <div className="p-3.5 rounded-lg border border-blue-500/30 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">
                        Kênh xuất bản đích: Fanpage &ldquo;Vitamin Sức Khỏe&rdquo;
                      </p>
                      <p className="leading-relaxed text-blue-800 dark:text-blue-300">
                        Yêu cầu sẽ được gửi an toàn đến webhook n8n WF03. n8n sẽ thực hiện kiểm tra quyền, tiến hành khóa trạng thái bài viết (<code>PUBLISHING</code>), gọi API Buffer và đối soát kết quả đăng thực tế lên Facebook.
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    disabled={processingId === confirmAction.post._id}
                    onClick={() => setConfirmAction(null)}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                    disabled={processingId === confirmAction.post._id}
                    onClick={() => executePublish(confirmAction.post._id)}
                  >
                    {processingId === confirmAction.post._id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang gửi yêu cầu...
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        Xác nhận đăng
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    {confirmAction.type === "approve" ? (
                      <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600">
                        <Check className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-full bg-rose-500/10 text-rose-600">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    )}
                    <DialogTitle className="text-base sm:text-lg">
                      {confirmAction.type === "approve"
                        ? "Xác Nhận Phê Duyệt Bài Viết Y Khoa"
                        : "Xác Nhận Từ Chối Bài Viết"}
                    </DialogTitle>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Bài viết: <strong className="text-foreground">{confirmAction.post.title}</strong> (ID: {confirmAction.post._id.slice(-6)})
                  </DialogDescription>
                </DialogHeader>

                {/* Warning Callout about n8n Automatic Publishing Eligibility */}
                {confirmAction.type === "approve" ? (
                  <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold">
                          Cảnh báo điều phối tự động hóa n8n WF03:
                        </p>
                        <p className="leading-relaxed text-amber-800 dark:text-amber-300">
                          Khi được phê duyệt, bài viết sẽ cập nhật trạng thái <code>HUMAN_APPROVED</code> và <code>requiresHumanReview = false</code>. Bài viết sẽ đủ điều kiện để Admin nhấn nút &ldquo;Đăng Facebook&rdquo; hoặc để quy trình tự động xuất bản theo lịch trình.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg border border-border bg-muted/40 text-xs space-y-1 text-muted-foreground">
                    <p>
                      Bài viết này sẽ được chuyển sang trạng thái <strong>REJECTED</strong> (`HUMAN_REJECTED`) và sẽ bị loại bỏ khỏi mọi luồng xuất bản của n8n.
                    </p>
                  </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    disabled={processingId === confirmAction.post._id}
                    onClick={() => setConfirmAction(null)}
                  >
                    Hủy bỏ
                  </Button>
                  {confirmAction.type === "approve" ? (
                    <Button
                      size="sm"
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={processingId === confirmAction.post._id}
                      onClick={() => executeApprove(confirmAction.post._id)}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Tôi xác nhận duyệt bài
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs"
                      disabled={processingId === confirmAction.post._id}
                      onClick={() => executeReject(confirmAction.post._id)}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Xác nhận từ chối
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </div>
        )}
      </Dialog>

      {/* Post Detail Dialog Modal */}
      <Dialog
        open={!!selectedPost}
        onOpenChange={(open) => !open && setSelectedPost(null)}
      >
        {selectedPost && (
          <div className="space-y-4">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={`text-[11px] border ${getContentStatusBadge(selectedPost.status).badgeClass
                    }`}
                >
                  {getContentStatusBadge(selectedPost.status).label}
                </Badge>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded border ${getReviewStatusBadge(selectedPost.reviewStatus).badgeClass
                    }`}
                >
                  {getReviewStatusBadge(selectedPost.reviewStatus).label}
                </span>
                {selectedPost.reconciliationStatus &&
                  selectedPost.reconciliationStatus !== ReconciliationStatus.NOT_REQUIRED && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded border ${getReconciliationBadge(selectedPost.reconciliationStatus).badgeClass
                        }`}
                    >
                      {getReconciliationBadge(selectedPost.reconciliationStatus).label}
                    </span>
                  )}
                <span className="font-mono text-xs text-muted-foreground ml-auto">
                  _id: {selectedPost._id}
                </span>
              </div>
              <DialogTitle className="text-base sm:text-lg text-left leading-snug">
                {selectedPost.title}
              </DialogTitle>
              <DialogDescription className="text-left text-xs text-muted-foreground">
                Chủ đề: <span className="font-semibold text-foreground">{selectedPost.topic}</span> • Tạo lúc:{" "}
                {formatDate(selectedPost.createdAt)} ({formatRelativeTime(selectedPost.createdAt)})
              </DialogDescription>
            </DialogHeader>

            {/* Reconciliation Warning Callout if NEEDS_MANUAL_REVIEW */}
            {selectedPost.reconciliationStatus === ReconciliationStatus.NEEDS_MANUAL_REVIEW && (
              <div className="p-3.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-200 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-rose-950 dark:text-rose-100">
                      Cảnh báo đối soát kết quả xuất bản (Buffer / Facebook):
                    </p>
                    <p className="leading-relaxed">
                      {selectedPost.reconciliationNote ||
                        "Hệ thống không nhận được xác nhận chính xác từ Buffer/Facebook. Vui lòng kiểm tra trực tiếp Fanpage 'Vitamin Sức Khỏe' và Buffer Dashboard trước khi thao tác tiếp."}
                    </p>
                    {selectedPost.bufferPostId && (
                      <p className="font-mono text-[11px] pt-1">
                        Buffer Post ID: <strong>{selectedPost.bufferPostId}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Medical Review Summary */}
            {selectedPost.medicalReview && (
              <div className="p-3.5 rounded-lg border border-border bg-muted/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Đánh giá Y khoa (NestJS / Ollama Engine)
                  </span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] border ${getMedicalReviewBadge(selectedPost.medicalReview.decision).badgeClass
                      }`}
                  >
                    {getMedicalReviewBadge(selectedPost.medicalReview.decision).label}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedPost.medicalReview.explanation || "Không có giải trình cụ thể."}
                </p>
                {selectedPost.medicalReview.medicalIssues &&
                  selectedPost.medicalReview.medicalIssues.length > 0 && (
                    <div className="pt-2 border-t border-border/60">
                      <span className="font-semibold text-rose-600 dark:text-rose-400 block mb-1">
                        Cảnh báo y khoa phát hiện:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {selectedPost.medicalReview.medicalIssues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {/* Reviewer Meta Callout */}
            <div className="p-3 rounded-lg border border-border/70 bg-background text-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-primary" />
                  Người kiểm duyệt: <strong className="text-foreground">{selectedPost.reviewer || "Chưa có"}</strong>
                </span>
                <span>
                  Thời điểm duyệt: {formatDate(selectedPost.reviewedAt)}
                </span>
              </div>
              {selectedPost.reviewMessage && (
                <p className="text-muted-foreground pt-1 border-t border-border/40 italic">
                  Lời nhắn: &ldquo;{selectedPost.reviewMessage}&rdquo;
                </p>
              )}
            </div>

            {/* Facebook Post Info if PUBLISHED */}
            {selectedPost.status === ContentStatus.PUBLISHED && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1.5">
                <div className="flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Đã xuất bản thành công lên Facebook Fanpage
                  </span>
                  <span>{formatDate(selectedPost.publishedAt)}</span>
                </div>
                {selectedPost.facebookPostId && (
                  <p className="font-mono text-[11px] text-muted-foreground pt-1 border-t border-emerald-500/20">
                    Facebook Post ID: <strong>{selectedPost.facebookPostId}</strong>
                  </p>
                )}
                {selectedPost.facebookPostUrl && (
                  <div className="pt-1">
                    <a
                      href={selectedPost.facebookPostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 hover:underline font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Xem bài đăng trên Facebook
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Informational Box for PUBLISHING Posts */}
            {selectedPost.status === ContentStatus.PUBLISHING && (
              <div className="p-3.5 rounded-lg border border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-cyan-800 dark:text-cyan-300">
                  <RefreshCw className="w-4 h-4 text-cyan-600 animate-spin" />
                  <span>Đang trong tiến trình khóa xuất bản WF03 (In-Flight Lock)</span>
                </div>
                <p className="text-cyan-700 dark:text-cyan-300 leading-relaxed">
                  Bài viết đang được n8n WF03 khóa nguyên tử chống trùng lặp và gửi tới Buffer. Trạng thái sẽ chuyển thành <code>PUBLISHED</code> ngay khi nhận phản hồi xác nhận từ Facebook.
                </p>
              </div>
            )}

            {/* Content Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Nội dung bài viết:
              </label>
              <div className="p-3.5 rounded-lg border border-border bg-muted/20 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                {selectedPost.body}
              </div>
            </div>

            {/* Modal Footer */}
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <div className="flex items-center gap-2 w-full justify-between sm:justify-end">
                {selectedPost.status !== ContentStatus.REJECTED &&
                  selectedPost.status !== ContentStatus.PUBLISHED &&
                  selectedPost.status !== ContentStatus.PUBLISHING && (
                    <Button
                      variant="outline"
                      className="text-xs border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      disabled={processingId === selectedPost._id}
                      onClick={() => setConfirmAction({ type: "reject", post: selectedPost })}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Từ chối bài viết
                    </Button>
                  )}

                {selectedPost.status !== ContentStatus.APPROVED &&
                  selectedPost.status !== ContentStatus.PUBLISHED &&
                  selectedPost.status !== ContentStatus.PUBLISHING && (
                    <Button
                      className="text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={processingId === selectedPost._id}
                      onClick={() => setConfirmAction({ type: "approve", post: selectedPost })}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Phê duyệt bài viết
                    </Button>
                  )}

                {/* Publish Facebook Button in Modal Footer if eligible */}
                {isPostEligibleForPublish(selectedPost) && (
                  <Button
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                    disabled={processingId === selectedPost._id}
                    onClick={() => setConfirmAction({ type: "publish", post: selectedPost })}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Đăng Facebook
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedPost(null)}
                >
                  Đóng
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
