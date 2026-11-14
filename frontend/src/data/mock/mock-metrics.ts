import { DashboardMetric, PublicationTrendPoint } from "@/types/dashboard";

export const MOCK_METRICS: DashboardMetric[] = [
  {
    title: "Tổng Bài Viết",
    value: 124,
    change: 12.5,
    trend: "up",
    description: "Tăng so với tháng trước",
    icon: "FileText",
  },
  {
    title: "Chờ Bác Sĩ Phê Duyệt",
    value: 18,
    change: -5.2,
    trend: "down",
    description: "Cần thẩm định lâm sàng",
    icon: "Clock",
  },
  {
    title: "Tỷ Lệ Đạt Chuẩn Y Khoa",
    value: "94.2%",
    change: 3.8,
    trend: "up",
    description: "Kiểm tra bởi mô hình AI & BS",
    icon: "ShieldCheck",
  },
  {
    title: "Hiệu Suất n8n Workflows",
    value: "98.1%",
    change: 0.5,
    trend: "up",
    description: "3/3 quy trình đang chạy ổn định",
    icon: "Cpu",
  },
];

export const MOCK_PUBLICATION_TREND: PublicationTrendPoint[] = [
  { date: "Thứ 2", posts: 14, approved: 12, rejected: 2 },
  { date: "Thứ 3", posts: 18, approved: 17, rejected: 1 },
  { date: "Thứ 4", posts: 22, approved: 20, rejected: 2 },
  { date: "Thứ 5", posts: 19, approved: 18, rejected: 1 },
  { date: "Thứ 6", posts: 25, approved: 23, rejected: 2 },
  { date: "Thứ 7", posts: 16, approved: 15, rejected: 1 },
  { date: "Chủ Nhật", posts: 10, approved: 10, rejected: 0 },
];
