export interface DashboardMetric {
  title: string;
  value: string | number;
  change: number; // percentage, positive or negative
  trend: 'up' | 'down' | 'neutral';
  description: string;
  icon: string;
}

export interface ActivitySummaryItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'generate' | 'review' | 'publish' | 'system' | 'error';
  status: 'success' | 'warning' | 'error' | 'info';
  userOrAgent: string;
}

export interface PublicationTrendPoint {
  date: string;
  posts: number;
  approved: number;
  rejected: number;
}
