import axios, { AxiosInstance, CancelTokenSource } from 'axios';
import { Ad, SummaryStats, ActivityChartItem, DecisionsChart, CategoriesChart } from '../types';

/**
 * API клиент для взаимодействия с backend сервером
 * Обеспечивает централизованное управление HTTP-запросами,
 * отмену запросов при навигации и обработку ошибок
 */
class ApiClient {
  private client: AxiosInstance;
  private cancelTokens: Map<string, CancelTokenSource> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Отменяет активный запрос по ключу
   * Используется для прерывания запросов при переходе между страницами
   * @param key - уникальный ключ запроса
   */
  cancelRequest(key: string) {
    const cancelToken = this.cancelTokens.get(key);
    if (cancelToken) {
      cancelToken.cancel('Request cancelled due to navigation');
      this.cancelTokens.delete(key);
    }
  }

  /**
   * Создает токен отмены для запроса
   * @param key - уникальный ключ для идентификации запроса
   * @returns CancelTokenSource для использования в запросе
   */
  private createCancelToken(key: string): CancelTokenSource {
    const source = axios.CancelToken.source();
    this.cancelTokens.set(key, source);
    return source;
  }

  /**
   * Получает список объявлений с фильтрацией, сортировкой и пагинацией
   * @param params - параметры фильтрации и пагинации
   * @returns Объект с массивом объявлений и общим количеством
   */
  async getAds(params: {
    status?: string[];
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ data: Ad[]; total: number }> {
    const cancelToken = this.createCancelToken('getAds');
    try {
      const apiParams: any = {
        page: params.page || 1,
        limit: params.limit || 10,
        sortBy: params.sortBy === 'date' ? 'createdAt' : params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc',
      };

      if (params.status && params.status.length > 0) {
        apiParams.status = params.status;
      }

      if (params.category) {
        // Маппинг названий категорий в их ID для API
        const categoryMap: Record<string, number> = {
          Электроника: 0,
          Недвижимость: 1,
          Транспорт: 2,
          Работа: 3,
          Услуги: 4,
          Животные: 5,
          Мода: 6,
          Детское: 7,
        };
        apiParams.categoryId = categoryMap[params.category];
      }

      if (params.minPrice !== undefined) {
        apiParams.minPrice = params.minPrice;
      }

      if (params.maxPrice !== undefined) {
        apiParams.maxPrice = params.maxPrice;
      }

      if (params.search) {
        apiParams.search = params.search;
      }

      const response = await this.client.get<{
        ads: Ad[];
        pagination: {
          currentPage: number;
          totalPages: number;
          totalItems: number;
          itemsPerPage: number;
        };
      }>('/ads', {
        params: apiParams,
        cancelToken: cancelToken.token,
      });

      return {
        data: response.data.ads,
        total: response.data.pagination.totalItems,
      };
    } finally {
      this.cancelTokens.delete('getAds');
    }
  }

  /**
   * Получает объявление по ID
   * @param id - идентификатор объявления
   * @returns Объект объявления с полной информацией
   */
  async getAdById(id: number): Promise<Ad> {
    const cancelToken = this.createCancelToken(`getAd-${id}`);
    try {
      const response = await this.client.get<Ad>(`/ads/${id}`, {
        cancelToken: cancelToken.token,
      });
      return response.data;
    } finally {
      this.cancelTokens.delete(`getAd-${id}`);
    }
  }

  /**
   * Одобряет объявление
   * @param id - идентификатор объявления
   * @returns Обновленное объявление
   */
  async approveAd(id: number): Promise<Ad> {
    const response = await this.client.post<{ message: string; ad: Ad }>(`/ads/${id}/approve`);
    return response.data.ad;
  }

  /**
   * Отклоняет объявление с указанием причины
   * @param id - идентификатор объявления
   * @param reason - причина отклонения
   * @param comment - дополнительный комментарий (опционально)
   * @returns Обновленное объявление
   */
  async rejectAd(id: number, reason: string, comment?: string): Promise<Ad> {
    const response = await this.client.post<{ message: string; ad: Ad }>(`/ads/${id}/reject`, {
      reason,
      comment,
    });
    return response.data.ad;
  }

  /**
   * Отправляет объявление на доработку
   * @param id - идентификатор объявления
   * @param reason - причина возврата на доработку
   * @param comment - дополнительный комментарий (опционально)
   * @returns Обновленное объявление
   */
  async requestChanges(id: number, reason: string, comment?: string): Promise<Ad> {
    const response = await this.client.post<{ message: string; ad: Ad }>(
      `/ads/${id}/request-changes`,
      { reason, comment }
    );
    return response.data.ad;
  }

  /**
   * Получает общую статистику модератора за указанный период
   * @param period - период: 'today', 'week' или 'month'
   * @returns Объект с метриками статистики
   */
  async getSummaryStats(period?: string): Promise<SummaryStats> {
    const cancelToken = this.createCancelToken('getSummaryStats');
    try {
      const response = await this.client.get<SummaryStats>('/stats/summary', {
        params: period ? { period } : {},
        cancelToken: cancelToken.token,
      });
      return response.data;
    } finally {
      this.cancelTokens.delete('getSummaryStats');
    }
  }

  /**
   * Получает данные для графика активности по дням
   * @param period - период: 'today', 'week' или 'month'
   * @returns Массив данных активности по дням
   */
  async getActivityChart(period?: string): Promise<ActivityChartItem[]> {
    const cancelToken = this.createCancelToken('getActivityChart');
    try {
      const response = await this.client.get<ActivityChartItem[]>('/stats/chart/activity', {
        params: period ? { period } : {},
        cancelToken: cancelToken.token,
      });
      return response.data;
    } finally {
      this.cancelTokens.delete('getActivityChart');
    }
  }

  /**
   * Получает данные для круговой диаграммы распределения решений
   * @param period - период: 'today', 'week' или 'month'
   * @returns Объект с количеством решений каждого типа
   */
  async getDecisionsChart(period?: string): Promise<DecisionsChart> {
    const cancelToken = this.createCancelToken('getDecisionsChart');
    try {
      const response = await this.client.get<DecisionsChart>('/stats/chart/decisions', {
        params: period ? { period } : {},
        cancelToken: cancelToken.token,
      });
      return response.data;
    } finally {
      this.cancelTokens.delete('getDecisionsChart');
    }
  }

  /**
   * Получает данные для графика распределения по категориям
   * @param period - период: 'today', 'week' или 'month'
   * @returns Объект с количеством объявлений по категориям
   */
  async getCategoriesChart(period?: string): Promise<CategoriesChart> {
    const cancelToken = this.createCancelToken('getCategoriesChart');
    try {
      const response = await this.client.get<CategoriesChart>('/stats/chart/categories', {
        params: period ? { period } : {},
        cancelToken: cancelToken.token,
      });
      return response.data;
    } finally {
      this.cancelTokens.delete('getCategoriesChart');
    }
  }

  /**
   * Получает список всех уникальных категорий из объявлений
   * @returns Массив названий категорий
   */
  async getCategories(): Promise<string[]> {
    const cancelToken = this.createCancelToken('getCategories');
    try {
      // Загружаем большое количество объявлений для извлечения всех категорий
      const response = await this.client.get<{
        ads: Ad[];
        pagination: any;
      }>('/ads', {
        params: { limit: 1000 },
        cancelToken: cancelToken.token,
      });
      // Извлекаем уникальные категории из массива объявлений
      const categories = Array.from(new Set(response.data.ads.map((ad) => ad.category)));
      return categories;
    } finally {
      this.cancelTokens.delete('getCategories');
    }
  }
}

export const apiClient = new ApiClient();
