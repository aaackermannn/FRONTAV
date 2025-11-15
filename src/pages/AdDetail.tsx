import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Button,
  Space,
  Row,
  Col,
  Table,
  Tag,
  Typography,
  Descriptions,
  Image,
  Modal,
  Radio,
  Input,
  message,
  Spin,
  Empty,
  Carousel,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { apiClient } from '../api/client';
import { Ad, RejectionReason } from '../types';
import dayjs from 'dayjs';
import { useHotkeys } from '../hooks/useHotkeys';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const REJECTION_REASONS: RejectionReason[] = [
  { id: 'prohibited', label: 'Запрещённый товар' },
  { id: 'wrong_category', label: 'Неверная категория' },
  { id: 'incorrect_description', label: 'Некорректное описание' },
  { id: 'photo_issues', label: 'Проблемы с фото' },
  { id: 'fraud_suspicion', label: 'Подозрение на мошенничество' },
  { id: 'other', label: 'Другое' },
];

const AdDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectionComment, setRejectionComment] = useState('');

  const adId = Number(id);

  const { data: ad, isLoading } = useQuery({
    queryKey: ['ad', adId],
    queryFn: () => apiClient.getAdById(adId),
    enabled: !!adId,
  });

  const { data: adsData } = useQuery({
    queryKey: ['ads'],
    queryFn: () => apiClient.getAds({ limit: 1000 }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (updates: Partial<Ad>) => apiClient.updateAd(adId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad', adId] });
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      message.success('Статус объявления обновлён');
    },
    onError: () => {
      message.error('Ошибка при обновлении статуса');
    },
  });

  const currentIndex = adsData?.data.findIndex((a) => a.id === adId) ?? -1;
  const prevAd = currentIndex > 0 ? adsData?.data[currentIndex - 1] : null;
  const nextAd =
    currentIndex >= 0 && currentIndex < (adsData?.data.length ?? 0) - 1
      ? adsData?.data[currentIndex + 1]
      : null;

  const handleApprove = () => {
    if (!ad) return;
    updateStatusMutation.mutate({
      ...ad,
      status: 'approved',
      moderationHistory: [
        ...ad.moderationHistory,
        {
          id: Date.now(),
          moderator: 'Иван',
          action: 'approved',
          comment: 'Одобрено модератором',
          timestamp: new Date().toISOString(),
        },
      ],
    });
  };

  const handleReject = () => {
    if (!rejectionReason) {
      message.warning('Выберите причину отклонения');
      return;
    }
    if (rejectionReason === 'other' && !rejectionComment.trim()) {
      message.warning('Укажите причину отклонения');
      return;
    }

    if (!ad) return;

    const reasonLabel =
      REJECTION_REASONS.find((r) => r.id === rejectionReason)?.label ||
      rejectionComment;

    updateStatusMutation.mutate({
      ...ad,
      status: 'rejected',
      moderationHistory: [
        ...ad.moderationHistory,
        {
          id: Date.now(),
          moderator: 'Иван',
          action: 'rejected',
          comment: reasonLabel,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    setRejectModalVisible(false);
    setRejectionReason('');
    setRejectionComment('');
  };

  const handleRework = () => {
    if (!ad) return;
    updateStatusMutation.mutate({
      ...ad,
      status: 'rework',
      moderationHistory: [
        ...ad.moderationHistory,
        {
          id: Date.now(),
          moderator: 'Иван',
          action: 'rework',
          comment: 'Требуется доработка',
          timestamp: new Date().toISOString(),
        },
      ],
    });
  };

  useHotkeys(
    [
      {
        key: 'a',
        handler: handleApprove,
      },
      {
        key: 'd',
        handler: () => setRejectModalVisible(true),
      },
      {
        key: 'ArrowRight',
        handler: () => {
          if (nextAd) navigate(`/item/${nextAd.id}`);
        },
      },
      {
        key: 'ArrowLeft',
        handler: () => {
          if (prevAd) navigate(`/item/${prevAd.id}`);
        },
      },
    ],
    !isLoading && !!ad
  );

  if (isLoading) {
    return (
      <Spin size="large" style={{ display: 'block', textAlign: 'center', padding: 50 }} />
    );
  }

  if (!ad) {
    return <Empty description="Объявление не найдено" />;
  }

  const characteristicsColumns = [
    {
      title: 'Характеристика',
      dataIndex: 'characteristic',
      key: 'characteristic',
    },
    {
      title: 'Значение',
      dataIndex: 'value',
      key: 'value',
    },
  ];

  const characteristicsData = Object.entries(ad.characteristics).map(
    ([key, value], index) => ({
      key: index,
      characteristic: key,
      value: value,
    })
  );

  const getStatusColor = (action: string) => {
    switch (action) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'rework':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getStatusText = (action: string) => {
    switch (action) {
      case 'approved':
        return 'Одобрено';
      case 'rejected':
        return 'Отклонено';
      case 'rework':
        return 'На доработке';
      default:
        return action;
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/list')}>
          К списку
        </Button>
        <Button
          disabled={!prevAd}
          icon={<LeftOutlined />}
          onClick={() => prevAd && navigate(`/item/${prevAd.id}`)}
        >
          Пред
        </Button>
        <Button
          disabled={!nextAd}
          icon={<RightOutlined />}
          onClick={() => nextAd && navigate(`/item/${nextAd.id}`)}
        >
          След
        </Button>
      </Space>

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card title="Галерея" style={{ marginBottom: 24 }}>
            <Carousel>
              {ad.images.map((image, index) => (
                <div key={index}>
                  <Image
                    src={image}
                    alt={`${ad.title} - изображение ${index + 1}`}
                    style={{ width: '100%', height: 400, objectFit: 'cover' }}
                  />
                </div>
              ))}
            </Carousel>
          </Card>

          <Card title="Полное описание">
            <Paragraph>{ad.description}</Paragraph>

            <Title level={5}>Характеристики</Title>
            <Table
              columns={characteristicsColumns}
              dataSource={characteristicsData}
              pagination={false}
              size="small"
              rowKey="key"
            />

            <Title level={5} style={{ marginTop: 24 }}>
              Информация о продавце
            </Title>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Имя">{ad.seller.name}</Descriptions.Item>
              <Descriptions.Item label="Рейтинг">
                <Tag color="gold">{ad.seller.rating}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Объявлений">
                {ad.seller.adsCount}
              </Descriptions.Item>
              <Descriptions.Item label="На сайте">
                {dayjs().diff(dayjs(ad.seller.registrationDate), 'year')} лет
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="История модерации"
            style={{ marginBottom: 24 }}
            extra={
              <Tag color={ad.priority === 'urgent' ? 'red' : 'default'}>
                {ad.priority === 'urgent' ? 'Срочно' : 'Обычный'}
              </Tag>
            }
          >
            {ad.moderationHistory.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {ad.moderationHistory.map((item) => (
                  <Card key={item.id} size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Модератор: </Text>
                        <Text>{item.moderator}</Text>
                      </div>
                      <div>
                        <Text strong>Дата: </Text>
                        <Text>
                          {dayjs(item.timestamp).format('DD.MM.YYYY HH:mm')}
                        </Text>
                      </div>
                      <div>
                        <Tag color={getStatusColor(item.action)}>
                          {getStatusText(item.action)}
                        </Tag>
                      </div>
                      {item.comment && (
                        <div>
                          <Text strong>Комментарий: </Text>
                          <Text>{item.comment}</Text>
                        </div>
                      )}
                    </Space>
                  </Card>
                ))}
              </Space>
            ) : (
              <Text type="secondary">История модерации отсутствует</Text>
            )}
          </Card>

          <Card title="Панель действий модератора">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size="large"
                block
                onClick={handleApprove}
                loading={updateStatusMutation.isPending}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                ✓ Одобрить (A)
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                size="large"
                block
                onClick={() => setRejectModalVisible(true)}
                loading={updateStatusMutation.isPending}
              >
                ✗ Отклонить (D)
              </Button>
              <Button
                icon={<ReloadOutlined />}
                size="large"
                block
                onClick={handleRework}
                loading={updateStatusMutation.isPending}
                style={{ color: '#faad14', borderColor: '#faad14' }}
              >
                ↻ Доработка
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Отклонение объявления"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectionReason('');
          setRejectionComment('');
        }}
        okText="Отправить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text strong>Причина:</Text>
          <Radio.Group
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical">
              {REJECTION_REASONS.map((reason) => (
                <Radio key={reason.id} value={reason.id}>
                  {reason.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
          {rejectionReason === 'other' && (
            <TextArea
              placeholder="Укажите причину отклонения"
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              rows={4}
            />
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default AdDetail;

