import { PublishingLogItem } from "@/types/publishing-log";
import { ActivitySummaryItem } from "@/types/dashboard";

export const MOCK_PUBLISHING_LOGS: PublishingLogItem[] = [
  {
    _id: "log-pub-001",
    contentId: "content-6733a103f28d",
    logStatus: "SUCCESS",
    logMessage: "Xuất bản bài viết thành công lên Facebook Page 'Bác Sĩ Gia Đình Việt Nam'.",
    publishingMode: "LIVE",
    facebookPostId: "fb_post_983172649182371",
    loggedAt: "2026-11-12T09:05:00.000Z",
  },
  {
    _id: "log-pub-002",
    contentId: "content-6733a102f28c",
    logStatus: "SIMULATED",
    logMessage: "Mô phỏng xuất bản thành công (Chế độ Sandbox). Bài viết đã sẵn sàng chờ xuất bản thật.",
    publishingMode: "SIMULATION",
    facebookPostId: "sim_fb_preview_381920",
    loggedAt: "2026-11-13T02:35:00.000Z",
  },
  {
    _id: "log-pub-003",
    contentId: "content-6733a104f28e",
    logStatus: "FAILED",
    logMessage: "Hủy tiến trình đăng tải: Bài viết bị từ chối do chưa đạt tiêu chuẩn y khoa.",
    publishingMode: "LIVE",
    facebookPostId: null,
    loggedAt: "2026-11-12T14:41:00.000Z",
  },
];

export const MOCK_ACTIVITIES: ActivitySummaryItem[] = [
  {
    id: "act-01",
    timestamp: "2026-11-13T06:00:15.000Z",
    title: "Tự động sinh nội dung thành công",
    description: "WF01 vừa tạo bài viết 'Bí Quyết Vàng Giúp Cải Thiện Giấc Ngủ Sâu Tự Nhiên' qua Ollama.",
    type: "generate",
    status: "success",
    userOrAgent: "Ollama (qwen2.5:7b)",
  },
  {
    id: "act-02",
    timestamp: "2026-11-13T04:15:00.000Z",
    title: "Thẩm định Y khoa hoàn tất",
    description: "Bộ lọc AI Y khoa đã đánh giá bài '5 Dấu Hiệu Thiếu Hụt Vitamin D': Đạt chuẩn y tế.",
    type: "review",
    status: "info",
    userOrAgent: "AI-Medical-Filter",
  },
  {
    id: "act-03",
    timestamp: "2026-11-13T02:30:00.000Z",
    title: "Bác sĩ phê duyệt bài viết",
    description: "BS. Nguyễn Minh Quân đã phê duyệt bài viết 'Chăm Sóc Răng Miệng Cho Trẻ Em'.",
    type: "review",
    status: "success",
    userOrAgent: "BS. Nguyễn Minh Quân",
  },
  {
    id: "act-04",
    timestamp: "2026-11-12T14:40:00.000Z",
    title: "Từ chối nội dung chưa chuẩn",
    description: "BS. Trần Thu Hà từ chối bài viết về 'Nước ép cần tây' do thiếu cảnh báo chống chỉ định.",
    type: "review",
    status: "warning",
    userOrAgent: "BS. Trần Thu Hà",
  },
  {
    id: "act-05",
    timestamp: "2026-11-12T09:05:00.000Z",
    title: "Xuất bản bài viết Facebook",
    description: "Đã xuất bản bài 'Cách Đo Huyết Áp Chuẩn Tại Nhà' lên Fanpage Bác Sĩ Gia Đình VN.",
    type: "publish",
    status: "success",
    userOrAgent: "WF03-fanpage-publishing",
  },
];
