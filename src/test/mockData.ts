import { Ad, SummaryStats, ActivityChartItem, DecisionsChart, CategoriesChart } from '../types';

/**
 * Моковые данные для тестирования
 */

export const mockAd: Ad = {
  id: 1,
  title: 'Тестовое объявление',
  price: 10000,
  category: 'Электроника',
  categoryId: 0,
  description: 'Описание тестового объявления',
  images: [
    'https://placehold.co/300x200/cccccc/969696?text=Image+1',
    'https://placehold.co/300x200/cccccc/969696?text=Image+2',
    'https://placehold.co/300x200/cccccc/969696?text=Image+3',
  ],
  characteristics: {
    Состояние: 'Новое',
    Гарантия: 'Есть',
    Производитель: 'Бренд A',
  },
  seller: {
    id: 1,
    name: 'Продавец 1',
    rating: 4.5,
    totalAds: 10,
    registeredAt: '2020-01-01T00:00:00.000Z',
  },
  status: 'pending',
  priority: 'normal',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  moderationHistory: [],
};

export const mockAds: Ad[] = [
  mockAd,
  {
    ...mockAd,
    id: 2,
    title: 'Второе объявление',
    status: 'approved',
    priority: 'urgent',
  },
  {
    ...mockAd,
    id: 3,
    title: 'Третье объявление',
    status: 'rejected',
  },
];

export const mockSummaryStats: SummaryStats = {
  totalReviewed: 100,
  totalReviewedToday: 10,
  totalReviewedThisWeek: 50,
  totalReviewedThisMonth: 80,
  approvedPercentage: 70.5,
  rejectedPercentage: 20.0,
  requestChangesPercentage: 9.5,
  averageReviewTime: 120,
};

export const mockActivityChart: ActivityChartItem[] = [
  { date: '2024-01-01', approved: 10, rejected: 2, requestChanges: 1 },
  { date: '2024-01-02', approved: 15, rejected: 3, requestChanges: 2 },
  { date: '2024-01-03', approved: 12, rejected: 1, requestChanges: 0 },
];

export const mockDecisionsChart: DecisionsChart = {
  approved: 70,
  rejected: 20,
  requestChanges: 10,
};

export const mockCategoriesChart: CategoriesChart = {
  Электроника: 30,
  Недвижимость: 25,
  Транспорт: 20,
  Работа: 15,
  Услуги: 10,
};
