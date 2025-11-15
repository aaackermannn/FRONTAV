import axios, { AxiosInstance, CancelTokenSource } from 'axios';
import { Ad, Statistics } from '../types';

class ApiClient {
  private client: AxiosInstance;
  private cancelTokens: Map<string, CancelTokenSource> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  cancelRequest(key: string) {
    const cancelToken = this.cancelTokens.get(key);
    if (cancelToken) {
      cancelToken.cancel('Request cancelled due to navigation');
      this.cancelTokens.delete(key);
    }
  }

  private createCancelToken(key: string): CancelTokenSource {
    const source = axios.CancelToken.source();
    this.cancelTokens.set(key, source);
    return source;
  }

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
      const response = await this.client.get<Ad[]>('/ads', {
        params,
        cancelToken: cancelToken.token,
      });

      let filtered = [...response.data];

      if (params.status && params.status.length > 0) {
        filtered = filtered.filter((ad) => params.status!.includes(ad.status));
      }

      if (params.category) {
        filtered = filtered.filter((ad) => ad.category === params.category);
      }

      if (params.minPrice !== undefined) {
        filtered = filtered.filter((ad) => ad.price >= params.minPrice!);
      }

      if (params.maxPrice !== undefined) {
        filtered = filtered.filter((ad) => ad.price <= params.maxPrice!);
      }

      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filtered = filtered.filter((ad) =>
          ad.title.toLowerCase().includes(searchLower)
        );
      }

      if (params.sortBy) {
        filtered.sort((a, b) => {
          let aVal: any;
          let bVal: any;

          switch (params.sortBy) {
            case 'date':
              aVal = new Date(a.createdAt).getTime();
              bVal = new Date(b.createdAt).getTime();
              break;
            case 'price':
              aVal = a.price;
              bVal = b.price;
              break;
            case 'priority':
              aVal = a.priority === 'urgent' ? 1 : 0;
              bVal = b.priority === 'urgent' ? 1 : 0;
              break;
            default:
              return 0;
          }

          if (params.sortOrder === 'desc') {
            return bVal - aVal;
          }
          return aVal - bVal;
        });
      }

      const total = filtered.length;
      const page = params.page || 1;
      const limit = params.limit || 10;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = filtered.slice(start, end);

      return { data: paginated, total };
    } finally {
      this.cancelTokens.delete('getAds');
    }
  }

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

  async updateAd(id: number, updates: Partial<Ad>): Promise<Ad> {
    const response = await this.client.put<Ad>(`/ads/${id}`, updates);
    return response.data;
  }

  async getStatistics(): Promise<Statistics> {
    const cancelToken = this.createCancelToken('getStatistics');
    try {
      const response = await this.client.get<Statistics>('/statistics', {
        cancelToken: cancelToken.token,
      });
      return response.data;
    } finally {
      this.cancelTokens.delete('getStatistics');
    }
  }

  async getCategories(): Promise<string[]> {
    const cancelToken = this.createCancelToken('getCategories');
    try {
      const response = await this.client.get<Ad[]>('/ads', {
        cancelToken: cancelToken.token,
      });
      const categories = Array.from(
        new Set(response.data.map((ad) => ad.category))
      );
      return categories;
    } finally {
      this.cancelTokens.delete('getCategories');
    }
  }
}

export const apiClient = new ApiClient();

