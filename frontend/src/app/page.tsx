import { contentsService } from "@/services/contents.service";
import { MOCK_PUBLICATION_TREND } from "@/data/mock/mock-metrics";
import { MOCK_WORKFLOWS } from "@/data/mock/mock-workflows";
import { MOCK_ACTIVITIES } from "@/data/mock/mock-logs";
import { MetricsOverview, MetricItem } from "@/components/dashboard/metrics-overview";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { WorkflowStatusCard } from "@/components/dashboard/workflow-status-card";
import { RecentPostsCard } from "@/components/dashboard/recent-posts-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ContentStatus } from "@/types/content";
import { Sparkles, RefreshCw, AlertCircle, Server } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { data: contents, error: apiError } = await contentsService.getContentsSafe();

  // Compute live KPIs strictly from real NestJS content records
  const totalContents = contents.length;
  const approvedOnlyCount = contents.filter(
    (c) => c.status === ContentStatus.APPROVED
  ).length;
  const publishedCount = contents.filter(
    (c) => c.status === ContentStatus.PUBLISHED
  ).length;
  const publishingCount = contents.filter(
    (c) => c.status === ContentStatus.PUBLISHING
  ).length;
  const totalApprovedAndPublished = approvedOnlyCount + publishedCount + publishingCount;
  const rejectedCount = contents.filter(
    (c) => c.status === ContentStatus.REJECTED
  ).length;
  const pendingCount = contents.filter(
    (c) => c.status === ContentStatus.PENDING_REVIEW
  ).length;
  const medicalApprovedCount = contents.filter(
    (c) => c.medicalReview?.decision === "APPROVED"
  ).length;
  const medicalNeedsReviewCount = contents.filter(
    (c) => c.medicalReview?.decision === "NEEDS_REVIEW"
  ).length;

  const dynamicMetrics: MetricItem[] = apiError
    ? [
        {
          title: "Tổng Bài Viết",
          value: "—",
          description: "Không thể lấy dữ liệu từ Backend",
          icon: "AlertCircle",
          badge: "Ngoại tuyến",
          badgeVariant: "warning",
        },
        {
          title: "Đã Phê Duyệt",
          value: "—",
          description: "Chờ kết nối máy chủ NestJS",
          icon: "CheckCircle2",
          badge: "Ngoại tuyến",
          badgeVariant: "warning",
        },
        {
          title: "Bị Từ Chối",
          value: "—",
          description: "Chờ kết nối máy chủ NestJS",
          icon: "XCircle",
          badge: "Ngoại tuyến",
          badgeVariant: "warning",
        },
        {
          title: "Thẩm Định Y Khoa",
          value: "—",
          description: "Chờ kết nối máy chủ NestJS",
          icon: "ShieldCheck",
          badge: "Ngoại tuyến",
          badgeVariant: "warning",
        },
      ]
    : [
        {
          title: "Tổng Bài Viết",
          value: totalContents,
          description: "Bản ghi thực tế từ MongoDB (/api/contents)",
          icon: "FileText",
          badge: "Live API",
          badgeVariant: "info",
        },
        {
          title: "Đã Phê Duyệt / Xuất Bản",
          value: `${totalApprovedAndPublished} bài`,
          description: `${approvedOnlyCount} chờ n8n WF03 • ${publishedCount} đã đăng${
            publishingCount > 0 ? ` • ${publishingCount} đang khóa` : ""
          }`,
          icon: "CheckCircle2",
          badge: "Bác sĩ phê duyệt",
          badgeVariant: "success",
        },
        {
          title: "Bị Từ Chối",
          value: `${rejectedCount} bài`,
          description: "Cần điều chỉnh nội dung y khoa",
          icon: "XCircle",
          badge: "Cần sửa lại",
          badgeVariant: "warning",
        },
        {
          title: "Chuẩn Y Khoa Tuyệt Đối",
          value: `${medicalApprovedCount}/${totalContents} bài`,
          description: `${medicalNeedsReviewCount} bài có ghi nhận 'NEEDS_REVIEW'`,
          icon: "ShieldCheck",
          badge: "Thẩm định AI & BS",
          badgeVariant: "neutral",
        },
      ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Bảng Điều Khiển Tổng Quan
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Server className="w-3 h-3" />
              Kết Nối API Thật
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Giám sát quy trình sinh nội dung AI, thẩm định y khoa chuẩn mực và lịch xuất bản tự động qua n8n.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 h-9"
              title="Tải lại dữ liệu mới nhất"
            >
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Làm mới</span>
            </Button>
          </Link>
          <Link href="/posts">
            <Button
              size="sm"
              className="text-xs gap-1.5 h-9 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <span>Xem quản lý bài viết</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Backend Connection Error Banner */}
      {apiError && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h3 className="font-semibold text-sm">
              Không thể kết nối đến NestJS Backend API (http://localhost:3000)
            </h3>
            <p className="text-rose-700 dark:text-rose-300">
              Chi tiết lỗi: <code className="font-mono bg-rose-100 dark:bg-rose-900/50 px-1 py-0.5 rounded">{apiError}</code>
            </p>
            <p className="text-rose-700 dark:text-rose-300">
              Vui lòng kiểm tra ứng dụng backend tại <code>/home/hanguyen/social-media-content-api</code> đang chạy cổng 3000.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions Shortcuts */}
      <QuickActions />

      {/* 4 Main KPI Cards (Strictly live data) */}
      <MetricsOverview metrics={dynamicMetrics} />

      {/* Analytics & Workflow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TrendChart data={MOCK_PUBLICATION_TREND} />
        <WorkflowStatusCard workflows={MOCK_WORKFLOWS} />
      </div>

      {/* Recent Posts Queue & Real-time Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentPostsCard initialPosts={contents} />
        <ActivityFeed activities={MOCK_ACTIVITIES} />
      </div>
    </div>
  );
}
