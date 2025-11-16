export type AdStatus = 'pending' | 'approved' | 'rejected' | 'draft';
export type Priority = 'normal' | 'urgent';

export interface Seller {
  id: number;
  name: string;
  rating: number;
  totalAds: number;
  registeredAt: string;
}

export interface ModerationHistoryItem {
  id: number;
  moderatorId: number;
  moderatorName: string;
  action: 'approved' | 'rejected' | 'requestChanges';
  reason: string | null;
  comment: string | null;
  timestamp: string;
}

export interface Ad {
  id: number;
  title: string;
  price: number;
  category: string;
  categoryId: number;
  description: string;
  images: string[];
  characteristics: Record<string, string>;
  seller: Seller;
  status: AdStatus;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  moderationHistory: ModerationHistoryItem[];
}

export interface SummaryStats {
  totalReviewed: number;
  totalReviewedToday: number;
  totalReviewedThisWeek: number;
  totalReviewedThisMonth: number;
  approvedPercentage: number;
  rejectedPercentage: number;
  requestChangesPercentage: number;
  averageReviewTime: number;
}

export interface ActivityChartItem {
  date: string;
  approved: number;
  rejected: number;
  requestChanges: number;
}

export interface DecisionsChart {
  approved: number;
  rejected: number;
  requestChanges: number;
}

export interface CategoriesChart {
  [category: string]: number;
}

export interface Statistics {
  summary: SummaryStats;
  activityChart: ActivityChartItem[];
  decisionsChart: DecisionsChart;
  categoriesChart: CategoriesChart;
}

export interface RejectionReason {
  id: string;
  label: string;
}
