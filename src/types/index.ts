export type AdStatus = 'pending' | 'approved' | 'rejected' | 'rework';
export type Priority = 'normal' | 'urgent';

export interface Seller {
  name: string;
  rating: number;
  adsCount: number;
  registrationDate: string;
}

export interface ModerationHistoryItem {
  id: number;
  moderator: string;
  action: 'approved' | 'rejected' | 'rework';
  comment?: string;
  timestamp: string;
}

export interface Ad {
  id: number;
  title: string;
  price: number;
  category: string;
  description: string;
  images: string[];
  characteristics: Record<string, string>;
  seller: Seller;
  status: AdStatus;
  priority: Priority;
  createdAt: string;
  moderationHistory: ModerationHistoryItem[];
}

export interface Statistics {
  today: {
    checked: number;
    approved: number;
    rejected: number;
    rework: number;
    avgTime: number;
  };
  week: {
    checked: number;
    approved: number;
    rejected: number;
    rework: number;
    avgTime: number;
  };
  month: {
    checked: number;
    approved: number;
    rejected: number;
    rework: number;
    avgTime: number;
  };
  activityByDay: Array<{
    date: string;
    count: number;
  }>;
  byCategory: Array<{
    category: string;
    count: number;
  }>;
}

export interface RejectionReason {
  id: string;
  label: string;
}

