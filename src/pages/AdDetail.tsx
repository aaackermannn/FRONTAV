import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { RejectionReason } from '../types';
import dayjs from 'dayjs';
import { useHotkeys } from '../hooks/useHotkeys';
import { generatePlaceholder } from '../utils/placeholder';

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
    queryKey: ['ads', 'all'],
    queryFn: () => apiClient.getAds({ limit: 1000 }),
  });

  const approveMutation = useMutation({
    mutationFn: () => apiClient.approveAd(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad', adId] });
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['summaryStats'] });
      queryClient.invalidateQueries({ queryKey: ['activityChart'] });
      queryClient.invalidateQueries({ queryKey: ['decisionsChart'] });
      queryClient.invalidateQueries({ queryKey: ['categoriesChart'] });
      message.success('Объявление одобрено');
    },
    onError: () => {
      message.error('Ошибка при одобрении объявления');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { reason: string; comment?: string }) =>
      apiClient.rejectAd(adId, data.reason, data.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad', adId] });
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['summaryStats'] });
      queryClient.invalidateQueries({ queryKey: ['activityChart'] });
      queryClient.invalidateQueries({ queryKey: ['decisionsChart'] });
      queryClient.invalidateQueries({ queryKey: ['categoriesChart'] });
      message.success('Объявление отклонено');
    },
    onError: () => {
      message.error('Ошибка при отклонении объявления');
    },
  });

  const requestChangesMutation = useMutation({
    mutationFn: (data: { reason: string; comment?: string }) =>
      apiClient.requestChanges(adId, data.reason, data.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad', adId] });
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['summaryStats'] });
      queryClient.invalidateQueries({ queryKey: ['activityChart'] });
      queryClient.invalidateQueries({ queryKey: ['decisionsChart'] });
      queryClient.invalidateQueries({ queryKey: ['categoriesChart'] });
      message.success('Запрос изменений отправлен');
    },
    onError: () => {
      message.error('Ошибка при запросе изменений');
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
    approveMutation.mutate();
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
      REJECTION_REASONS.find((r) => r.id === rejectionReason)?.label || rejectionComment;

    rejectMutation.mutate({
      reason: reasonLabel,
      comment: rejectionComment || undefined,
    });

    setRejectModalVisible(false);
    setRejectionReason('');
    setRejectionComment('');
  };

  const handleRework = () => {
    if (!ad) return;
    requestChangesMutation.mutate({
      reason: 'Требуется доработка',
      comment: 'Требуется доработка',
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
    return <Spin size="large" style={{ display: 'block', textAlign: 'center', padding: 50 }} />;
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

  const characteristicsData = Object.entries(ad.characteristics).map(([key, value], index) => ({
    key: index,
    characteristic: key,
    value: value,
  }));

  const getStatusColor = (action: string) => {
    switch (action) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'requestChanges':
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
      case 'requestChanges':
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
            <Image.PreviewGroup>
              <Carousel>
                {ad.images.map((_, index) => (
                  <div key={index}>
                    <Image
                      src={generatePlaceholder(800, 400, `${ad.title} - ${index + 1}`)}
                      alt={`${ad.title} - изображение ${index + 1}`}
                      style={{ width: '100%', height: 400, objectFit: 'cover' }}
                      preview={{
                        mask: 'Увеличить',
                      }}
                    />
                  </div>
                ))}
              </Carousel>
            </Image.PreviewGroup>
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
              <Descriptions.Item label="Объявлений">{ad.seller.totalAds}</Descriptions.Item>
              <Descriptions.Item label="На сайте">
                {dayjs().diff(dayjs(ad.seller.registeredAt), 'year')} лет
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
                        <Text>{item.moderatorName}</Text>
                      </div>
                      <div>
                        <Text strong>Дата: </Text>
                        <Text>{dayjs(item.timestamp).format('DD.MM.YYYY HH:mm')}</Text>
                      </div>
                      <div>
                        <Tag color={getStatusColor(item.action)}>{getStatusText(item.action)}</Tag>
                      </div>
                      {item.reason && (
                        <div>
                          <Text strong>Причина: </Text>
                          <Text>{item.reason}</Text>
                        </div>
                      )}
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
                loading={approveMutation.isPending}
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
                loading={rejectMutation.isPending}
              >
                ✗ Отклонить (D)
              </Button>
              <Button
                icon={<ReloadOutlined />}
                size="large"
                block
                onClick={handleRework}
                loading={requestChangesMutation.isPending}
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
