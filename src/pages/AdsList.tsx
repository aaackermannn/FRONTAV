import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Input,
  Select,
  Button,
  Row,
  Col,
  Pagination,
  Space,
  Tag,
  Checkbox,
  Typography,
  Spin,
  Empty,
  InputNumber,
  message,
  Badge,
  Popover,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  BellOutlined,
  SaveOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { apiClient } from '../api/client';
import { AdStatus } from '../types';
import dayjs from 'dayjs';
import { useHotkeys } from '../hooks/useHotkeys';
import { generatePlaceholder } from '../utils/placeholder';

const { Option } = Select;
const { Text } = Typography;

const STATUS_OPTIONS: { label: string; value: AdStatus }[] = [
  { label: 'На модерации', value: 'pending' },
  { label: 'Одобрено', value: 'approved' },
  { label: 'Отклонено', value: 'rejected' },
  { label: 'На доработке', value: 'draft' },
];

const AdsList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [savedFilters, setSavedFilters] = useState<Array<{ name: string; params: string }>>(() =>
    JSON.parse(localStorage.getItem('savedFilters') || '[]')
  );

  const status = (searchParams.get('status')?.split(',') || []) as AdStatus[];
  const category = searchParams.get('category') || undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'date';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const page = Number(searchParams.get('page')) || 1;

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ads', status, category, minPrice, maxPrice, search, sortBy, sortOrder, page],
    queryFn: () =>
      apiClient.getAds({
        status: status.length > 0 ? (status as AdStatus[]) : undefined,
        category,
        minPrice,
        maxPrice,
        search: search || undefined,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        page,
        limit: 10,
      }),
    refetchInterval: 30000,
  });

  const [newAdsCount, setNewAdsCount] = useState(0);
  const [lastCheckedCount, setLastCheckedCount] = useState(0);

  useEffect(() => {
    if (data?.total !== undefined) {
      if (lastCheckedCount > 0 && data.total > lastCheckedCount) {
        setNewAdsCount(data.total - lastCheckedCount);
      }
      setLastCheckedCount(data.total);
    }
  }, [data?.total, lastCheckedCount]);

  const updateParams = (updates: Record<string, string | undefined>, resetPage = true) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    // Сбрасываем страницу только если это не изменение самой страницы
    if (resetPage && !updates.hasOwnProperty('page')) {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const handleStatusChange = (values: AdStatus[]) => {
    updateParams({ status: values.length > 0 ? values.join(',') : undefined });
  };

  const handleCategoryChange = (value: string) => {
    updateParams({ category: value || undefined });
  };

  const handlePriceRangeChange = (min: number | null, max: number | null) => {
    updateParams({
      minPrice: min ? String(min) : undefined,
      maxPrice: max ? String(max) : undefined,
    });
  };

  const handleSearchChange = (value: string) => {
    updateParams({ search: value || undefined });
  };

  const handleSortChange = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      updateParams({ sortOrder: newOrder });
    } else {
      updateParams({ sortBy: newSortBy, sortOrder: 'desc' });
    }
  };

  const handleResetFilters = () => {
    setSearchParams({});
    setSelectedIds([]);
  };

  const handleSaveFilter = () => {
    const filterName = prompt('Введите название набора фильтров:');
    if (filterName && filterName.trim()) {
      const newSaved = [
        ...savedFilters,
        { name: filterName.trim(), params: searchParams.toString() },
      ];
      setSavedFilters(newSaved);
      localStorage.setItem('savedFilters', JSON.stringify(newSaved));
      message.success('Набор фильтров сохранён');
    }
  };

  const handleLoadFilter = (params: string) => {
    const newParams = new URLSearchParams(params);
    setSearchParams(newParams);
    message.success('Набор фильтров загружен');
  };

  const handleDeleteFilter = (index: number) => {
    const newSaved = savedFilters.filter((_, i) => i !== index);
    setSavedFilters(newSaved);
    localStorage.setItem('savedFilters', JSON.stringify(newSaved));
    message.success('Набор фильтров удалён');
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const handleBulkApprove = async () => {
    try {
      for (const id of selectedIds) {
        await apiClient.approveAd(id);
      }
      message.success(`Одобрено объявлений: ${selectedIds.length}`);
      setSelectedIds([]);
      refetch();
    } catch (error) {
      message.error('Ошибка при одобрении объявлений');
    }
  };

  const handleBulkReject = async () => {
    try {
      for (const id of selectedIds) {
        await apiClient.rejectAd(id, 'Массовое отклонение', 'Массовое отклонение');
      }
      message.success(`Отклонено объявлений: ${selectedIds.length}`);
      setSelectedIds([]);
      refetch();
    } catch (error) {
      message.error('Ошибка при отклонении объявлений');
    }
  };

  useHotkeys([
    {
      key: '/',
      handler: () => {
        // Ищем поле поиска по data-атрибуту или placeholder
        const searchInput =
          (document.querySelector('input[data-testid="search-input"]') as HTMLInputElement) ||
          (document.querySelector('input[placeholder*="Поиск"]') as HTMLInputElement) ||
          (document.querySelector('input[placeholder*="поиск"]') as HTMLInputElement);
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
    },
  ]);

  const getStatusTag = (status: AdStatus) => {
    const statusConfig = {
      pending: { color: 'orange', text: 'На модерации' },
      approved: { color: 'green', text: 'Одобрено' },
      rejected: { color: 'red', text: 'Отклонено' },
      draft: { color: 'yellow', text: 'На доработке' },
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
      {newAdsCount > 0 && (
        <Card
          style={{
            marginBottom: 24,
            background: '#e6f7ff',
            border: '1px solid #91d5ff',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <Space>
            <Badge count={newAdsCount} showZero={false}>
              <BellOutlined style={{ fontSize: 20 }} />
            </Badge>
            <Text strong>Новых объявлений: {newAdsCount}</Text>
            <Button
              size="small"
              onClick={() => {
                setNewAdsCount(0);
                refetch();
              }}
            >
              Обновить
            </Button>
          </Space>
        </Card>
      )}
      <Card
        title="Фильтры"
        style={{ marginBottom: 24 }}
        extra={
          <Space>
            {savedFilters.length > 0 && (
              <Popover
                content={
                  <div>
                    {savedFilters.map((filter, index) => (
                      <div key={index} style={{ marginBottom: 8 }}>
                        <Space>
                          <Button type="link" onClick={() => handleLoadFilter(filter.params)}>
                            {filter.name}
                          </Button>
                          <Button
                            type="link"
                            danger
                            size="small"
                            onClick={() => handleDeleteFilter(index)}
                          >
                            Удалить
                          </Button>
                        </Space>
                      </div>
                    ))}
                  </div>
                }
                title="Сохранённые наборы фильтров"
                trigger="click"
              >
                <Button icon={<FolderOutlined />}>Загрузить</Button>
              </Popover>
            )}
            <Button icon={<SaveOutlined />} onClick={handleSaveFilter}>
              Сохранить
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
              Сбросить
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Row gutter={16}>
            <Col span={6}>
              <Text strong>Статус:</Text>
              <Select
                mode="multiple"
                placeholder="Выберите статус"
                style={{ width: '100%', marginTop: 8 }}
                value={status}
                onChange={handleStatusChange}
              >
                {STATUS_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Text strong>Категория:</Text>
              <Select
                placeholder="Выберите категорию"
                style={{ width: '100%', marginTop: 8 }}
                value={category}
                onChange={handleCategoryChange}
                allowClear
              >
                {categories.map((cat) => (
                  <Option key={cat} value={cat}>
                    {cat}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Text strong>Цена:</Text>
              <Space style={{ width: '100%', marginTop: 8 }}>
                <InputNumber
                  placeholder="От"
                  value={minPrice}
                  onChange={(val) => handlePriceRangeChange(val, maxPrice || null)}
                  style={{ width: '100%' }}
                  min={0}
                />
                <InputNumber
                  placeholder="До"
                  value={maxPrice}
                  onChange={(val) => handlePriceRangeChange(minPrice || null, val)}
                  style={{ width: '100%' }}
                  min={0}
                />
              </Space>
            </Col>
            <Col span={6}>
              <Text strong>Поиск:</Text>
              <Input
                placeholder="Поиск по названию"
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{ marginTop: 8 }}
                data-testid="search-input"
              />
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Text strong>Сортировка: </Text>
              <Space>
                <Button
                  type={sortBy === 'date' ? 'primary' : 'default'}
                  onClick={() => handleSortChange('date')}
                >
                  По дате {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
                <Button
                  type={sortBy === 'price' ? 'primary' : 'default'}
                  onClick={() => handleSortChange('price')}
                >
                  По цене {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
                <Button
                  type={sortBy === 'priority' ? 'primary' : 'default'}
                  onClick={() => handleSortChange('priority')}
                >
                  По приоритету {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      {selectedIds.length > 0 && (
        <Card style={{ marginBottom: 24, background: '#e6f7ff' }}>
          <Space>
            <Text strong>Выбрано: {selectedIds.length}</Text>
            <Button type="primary" icon={<CheckOutlined />} onClick={handleBulkApprove}>
              Одобрить все
            </Button>
            <Button danger icon={<CloseOutlined />} onClick={handleBulkReject}>
              Отклонить все
            </Button>
            <Button onClick={() => setSelectedIds([])}>Отменить выбор</Button>
          </Space>
        </Card>
      )}

      {isLoading ? (
        <Spin size="large" style={{ display: 'block', textAlign: 'center', padding: 50 }} />
      ) : !data?.data.length ? (
        <Empty description="Объявления не найдены" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {data.data.map((ad, index) => (
              <Col
                key={ad.id}
                xs={24}
                sm={12}
                lg={8}
                xl={6}
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
                }}
              >
                <Card
                  hoverable
                  cover={
                    <img
                      alt={ad.title}
                      src={generatePlaceholder(400, 200, ad.title)}
                      style={{ height: 200, objectFit: 'cover' }}
                    />
                  }
                  actions={[
                    <Checkbox
                      checked={selectedIds.includes(ad.id)}
                      onChange={(e) => handleSelectItem(ad.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Выбрать
                    </Checkbox>,
                    <Button type="link" onClick={() => navigate(`/item/${ad.id}`)}>
                      Открыть →
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <Space>
                        {ad.title}
                        {ad.priority === 'urgent' && <Tag color="red">Срочно</Tag>}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong style={{ fontSize: 18 }}>
                          {ad.price.toLocaleString('ru-RU')} ₽
                        </Text>
                        <div>
                          {getStatusTag(ad.status)}
                          <Tag>{ad.category}</Tag>
                        </div>
                        <Text type="secondary">
                          {dayjs(ad.createdAt).format('DD.MM.YYYY HH:mm')}
                        </Text>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Pagination
              current={page}
              total={data.total}
              pageSize={10}
              showSizeChanger={false}
              showTotal={(total) => `Всего: ${total} объявлений`}
              onChange={(newPage) => updateParams({ page: String(newPage) }, false)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AdsList;
