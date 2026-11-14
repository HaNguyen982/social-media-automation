"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ContentItem, ContentStatus } from "@/types/content";
import {
  getContentStatusBadge,
  getMedicalReviewBadge,
  getReviewStatusBadge,
  formatDate,
  formatRelativeTime,
} from "@/lib/utils";
import { contentsService } from "@/services/contents.service";
import {
  Check,
  X,
  Eye,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Workflow,
  RefreshCw,
  UserCheck,
} from "lucide-react";

interface RecentPostsCardProps {
  initialPosts: ContentItem[];
}

export function RecentPostsCard({ initialPosts }: RecentPostsCardProps) {
  const [posts, setPosts] = useState<ContentItem[]>(initialPosts);
  const [selectedPost, setSelectedPost] = useState<ContentItem | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Confirmation dialog state for Approve and Reject actions
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    post: ContentItem;
  } | null>(null);

  const executeApprove = async (id: string) => {
    try {
      setIsProcessing(id);
      const updated = await contentsService.approveContent(id, {
        reviewer: "HUMAN_REVIEWER",
        reviewMessage: "Đạt tiêu chuẩn y khoa và sẵn sàng cho WF03 xuất bản.",
      });
      setPosts((prev) => prev.map((p) => (p._id === id ? updated : p)));
      if (selectedPost?._id === id) {
        setSelectedPost(updated);
      }
    } catch (err) {
      console.error("Lỗi duyệt bài:", err);
      alert(err instanceof Error ? err.message : "Duyệt bài thất bại");
    } finally {
      setIsProcessing(null);
      setConfirmAction(null);
    }
  };

  const executeReject = async (id: string) => {
    try {
      setIsProcessing(id);
      const updated = await contentsService.rejectContent(id, {
        reviewer: "HUMAN_REVIEWER",
        reviewMessage: "Từ chối duyệt: Cần điều chỉnh thuật ngữ y khoa.",
      });
      setPosts((prev) => prev.map((p) => (p._id === id ? updated : p)));
      if (selectedPost?._id === id) {
        setSelectedPost(updated);
      }
    } catch (err) {
      console.error("Lỗi từ chối bài:", err);
      alert(err instanceof Error ? err.message : "Từ chối bài thất bại");
    } finally {
      setIsProcessing(null);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <Card className="col-span-1 lg:col-span-2 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                Bài Viết Gần Đây & Hàng Đợi Thẩm Định
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[10px] font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              >
                NestJS Live Data
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Các bài viết thực tế được lưu trữ trong MongoDB thông qua NestJS API
            </CardDescription>
          </div>
          <Link href="/posts">
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-8">
              Tất cả bài viết
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs font-semibold">Tiêu đề & ID bài viết</TableHead>
                <TableHead className="text-xs font-semibold hidden md:table-cell">Chủ đề</TableHead>
                <TableHead className="text-xs font-semibold">Thẩm định Y khoa</TableHead>
                <TableHead className="text-xs font-semibold">Trạng thái</TableHead>
                <TableHead className="text-xs font-semibold text-right pr-4">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-sm text-muted-foreground"
                  >
                    Chưa có bài viết nào hoặc không thể kết nối đến máy chủ API.
                  </TableCell>
                </TableRow>
              ) : (
                posts.slice(0, 5).map((post) => {
                  const statusMeta = getContentStatusBadge(post.status);
                  const medMeta = getMedicalReviewBadge(
                    post.medicalReview?.decision
                  );
                  const isBusy = isProcessing === post._id;

                  return (
                    <TableRow key={post._id} className="group hover:bg-muted/30">
                      <TableCell className="max-w-[280px]">
                        <div className="flex flex-col">
                          <span
                            className="font-medium text-xs sm:text-sm text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                            onClick={() => setSelectedPost(post)}
                            title={post.title}
                          >
                            {post.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-400">
                              {post._id.slice(-6)}
                            </span>
                            • {formatRelativeTime(post.createdAt)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell max-w-[150px]">
                        <span className="text-xs text-muted-foreground truncate block">
                          {post.topic}
                        </span>
                      </TableCell>

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

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-medium px-2 py-0.5 border ${statusMeta.badgeClass}`}
                        >
                          {statusMeta.label}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setSelectedPost(post)}
                            title="Xem chi tiết nội dung"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {/* Approve with Confirmation */}
                          {post.status !== ContentStatus.APPROVED &&
                            post.status !== ContentStatus.PUBLISHED &&
                            post.status !== ContentStatus.PUBLISHING && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                className="h-7 px-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border-emerald-500/30"
                                onClick={() => setConfirmAction({ type: "approve", post })}
                                title="Phê duyệt bài viết (yêu cầu xác nhận)"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Duyệt
                              </Button>
                            )}

                          {/* Reject with Confirmation */}
                          {post.status !== ContentStatus.REJECTED &&
                            post.status !== ContentStatus.PUBLISHED &&
                            post.status !== ContentStatus.PUBLISHING && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                className="h-7 px-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border-rose-500/30"
                                onClick={() => setConfirmAction({ type: "reject", post })}
                                title="Từ chối bài viết (yêu cầu xác nhận)"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Hủy
                              </Button>
                            )}

                          {/* Safe Informational UI for APPROVED posts */}
                          {post.status === ContentStatus.APPROVED && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                              title="Bài viết đã duyệt. Chờ n8n WF03 tự động xuất bản."
                            >
                              <Workflow className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span>Chờ WF03</span>
                            </span>
                          )}

                          {/* Safe Informational UI for PUBLISHING posts */}
                          {post.status === ContentStatus.PUBLISHING && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20"
                              title="Bài viết đang được n8n xử lý xuất bản."
                            >
                              <RefreshCw className="w-3 h-3 text-cyan-600 animate-spin shrink-0" />
                              <span>n8n xử lý</span>
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

      {/* Confirmation Dialog for Approve / Reject */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        {confirmAction && (
          <div className="space-y-4">
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

            {confirmAction.type === "approve" ? (
              <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">
                      Cảnh báo điều phối tự động hóa n8n WF03:
                    </p>
                    <p className="leading-relaxed text-amber-800 dark:text-amber-300">
                      Khi được phê duyệt, bài viết sẽ cập nhật trạng thái <code>HUMAN_APPROVED</code> và <code>requiresHumanReview = false</code>. Kịch bản tự động hóa <strong>n8n WF03 (Automatic Fanpage Publishing)</strong> sẽ tự động nhận diện bài viết này đủ điều kiện và có thể tự động xuất bản lên Facebook Fanpage theo lịch trình.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
                <p>
                  Bài viết này sẽ được đánh dấu <strong>REJECTED</strong> và loại bỏ khỏi mọi tiến trình xuất bản tự động của n8n.
                </p>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={isProcessing === confirmAction.post._id}
                onClick={() => setConfirmAction(null)}
              >
                Hủy bỏ
              </Button>
              {confirmAction.type === "approve" ? (
                <Button
                  size="sm"
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isProcessing === confirmAction.post._id}
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
                  disabled={isProcessing === confirmAction.post._id}
                  onClick={() => executeReject(confirmAction.post._id)}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Xác nhận từ chối
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* Detail & Review Modal */}
      <Dialog
        open={!!selectedPost}
        onOpenChange={(open) => !open && setSelectedPost(null)}
      >
        {selectedPost && (
          <div className="space-y-4">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Badge
                  variant="outline"
                  className={`text-[11px] border ${
                    getContentStatusBadge(selectedPost.status).badgeClass
                  }`}
                >
                  {getContentStatusBadge(selectedPost.status).label}
                </Badge>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded border ${
                    getReviewStatusBadge(selectedPost.reviewStatus).badgeClass
                  }`}
                >
                  {getReviewStatusBadge(selectedPost.reviewStatus).label}
                </span>
                <span className="text-xs text-muted-foreground font-mono ml-auto">
                  _id: {selectedPost._id}
                </span>
              </div>
              <DialogTitle className="text-base sm:text-lg text-left leading-snug">
                {selectedPost.title}
              </DialogTitle>
              <DialogDescription className="text-left text-xs text-muted-foreground">
                Chủ đề: <span className="font-medium text-foreground">{selectedPost.topic}</span> • Tạo lúc:{" "}
                {formatDate(selectedPost.createdAt)} ({formatRelativeTime(selectedPost.createdAt)})
              </DialogDescription>
            </DialogHeader>

            {/* Medical Review Summary Callout */}
            {selectedPost.medicalReview && (
              <div className="p-3.5 rounded-lg border border-border bg-muted/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Thẩm định Y khoa (Ollama + Medical Engine)
                  </span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] border ${
                      getMedicalReviewBadge(selectedPost.medicalReview.decision).badgeClass
                    }`}
                  >
                    {getMedicalReviewBadge(selectedPost.medicalReview.decision).label}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedPost.medicalReview.explanation || "Không có giải trình cụ thể."}
                </p>
                {selectedPost.medicalReview.medicalIssues && selectedPost.medicalReview.medicalIssues.length > 0 && (
                  <div className="pt-2 border-t border-border/60">
                    <span className="font-semibold text-rose-600 dark:text-rose-400 block mb-1">
                      Các lưu ý / rủi ro y khoa phát hiện:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {selectedPost.medicalReview.medicalIssues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Reviewer Meta */}
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

            {/* Safe Informational Box for APPROVED Posts */}
            {selectedPost.status === ContentStatus.APPROVED && (
              <div className="p-3.5 rounded-lg border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-blue-800 dark:text-blue-300">
                  <Workflow className="w-4 h-4 text-blue-600" />
                  <span>Sẵn sàng cho quy trình n8n WF03 (Xuất bản tự động)</span>
                </div>
                <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                  Bài viết này đã được Bác sĩ phê duyệt (<code>HUMAN_APPROVED</code>). Quy trình tự động hóa <strong>n8n WF03 (Automatic Fanpage Publishing)</strong> sẽ tự động nhận diện bài viết này theo lịch trình, thực hiện khóa bài và đăng tải lên Facebook Fanpage.
                </p>
              </div>
            )}

            {/* Informational Box for PUBLISHING Posts */}
            {selectedPost.status === ContentStatus.PUBLISHING && (
              <div className="p-3.5 rounded-lg border border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-cyan-800 dark:text-cyan-300">
                  <RefreshCw className="w-4 h-4 text-cyan-600 animate-spin" />
                  <span>Đang trong tiến trình n8n WF03 (In-Flight Lock)</span>
                </div>
                <p className="text-cyan-700 dark:text-cyan-300 leading-relaxed">
                  Bài viết đang được n8n khóa nguyên tử chống trùng lặp để tiến hành đăng lên Facebook.
                </p>
              </div>
            )}

            {/* Content Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Nội dung bài viết:
              </label>
              <div className="p-3.5 rounded-lg border border-border bg-background text-xs sm:text-sm leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                {selectedPost.body}
              </div>
            </div>

            {/* Action Buttons in Modal */}
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <div className="flex items-center gap-2 w-full justify-between sm:justify-end">
                {selectedPost.status !== ContentStatus.REJECTED &&
                  selectedPost.status !== ContentStatus.PUBLISHED &&
                  selectedPost.status !== ContentStatus.PUBLISHING && (
                    <Button
                      variant="outline"
                      className="text-xs border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      disabled={isProcessing === selectedPost._id}
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
                      disabled={isProcessing === selectedPost._id}
                      onClick={() => setConfirmAction({ type: "approve", post: selectedPost })}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Phê duyệt bài viết
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
    </>
  );
}
