import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockAd, mockAds } from '../../test/mockData';

// Мокаем axios до импорта клиента
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockAxiosInstance = {
  get: mockGet,
  post: mockPost,
};

vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      CancelToken: {
        source: vi.fn(() => ({
          token: {},
          cancel: vi.fn(),
        })),
      },
    },
  };
});

describe('ApiClient', () => {
  let apiClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Динамически импортируем клиент после настройки моков
    const module = await import('../client');
    apiClient = module.apiClient;
  });

  describe('getAds', () => {
    it('должен получать список объявлений с правильными параметрами', async () => {
      const mockResponse = {
        data: {
          ads: mockAds,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: mockAds.length,
            itemsPerPage: 10,
          },
        },
      };

      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await apiClient.getAds({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockAds);
      expect(result.total).toBe(mockAds.length);
    });

    it('должен преобразовывать категорию в categoryId', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          ads: mockAds,
          pagination: { totalItems: mockAds.length },
        },
      });

      await apiClient.getAds({ category: 'Электроника' });

      expect(mockGet).toHaveBeenCalledWith(
        '/ads',
        expect.objectContaining({
          params: expect.objectContaining({
            categoryId: 0,
          }),
        })
      );
    });
  });

  describe('getAdById', () => {
    it('должен получать объявление по ID', async () => {
      mockGet.mockResolvedValueOnce({ data: mockAd });

      const result = await apiClient.getAdById(1);

      expect(result).toEqual(mockAd);
      expect(mockGet).toHaveBeenCalledWith('/ads/1', expect.any(Object));
    });
  });

  describe('approveAd', () => {
    it('должен одобрять объявление', async () => {
      mockPost.mockResolvedValueOnce({
        data: { message: 'Success', ad: { ...mockAd, status: 'approved' } },
      });

      const result = await apiClient.approveAd(1);

      expect(result.status).toBe('approved');
      expect(mockPost).toHaveBeenCalledWith('/ads/1/approve');
    });
  });

  describe('rejectAd', () => {
    it('должен отклонять объявление с причиной', async () => {
      mockPost.mockResolvedValueOnce({
        data: { message: 'Success', ad: { ...mockAd, status: 'rejected' } },
      });

      const result = await apiClient.rejectAd(1, 'Причина отклонения', 'Комментарий');

      expect(result.status).toBe('rejected');
      expect(mockPost).toHaveBeenCalledWith('/ads/1/reject', {
        reason: 'Причина отклонения',
        comment: 'Комментарий',
      });
    });
  });

  describe('requestChanges', () => {
    it('должен отправлять объявление на доработку', async () => {
      mockPost.mockResolvedValueOnce({
        data: { message: 'Success', ad: { ...mockAd, status: 'draft' } },
      });

      const result = await apiClient.requestChanges(1, 'Требуется доработка');

      expect(result.status).toBe('draft');
      expect(mockPost).toHaveBeenCalledWith('/ads/1/request-changes', {
        reason: 'Требуется доработка',
        comment: undefined,
      });
    });
  });

  describe('cancelRequest', () => {
    it('должен отменять активный запрос', () => {
      const cancelFn = vi.fn();
      const cancelToken = { cancel: cancelFn, token: {} };

      // Мокаем внутреннюю структуру
      const client = apiClient as any;
      client.cancelTokens.set('test-key', cancelToken);

      apiClient.cancelRequest('test-key');

      expect(cancelFn).toHaveBeenCalledWith('Request cancelled due to navigation');
      expect(client.cancelTokens.has('test-key')).toBe(false);
    });
  });
});
