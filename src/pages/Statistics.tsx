import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Select, Button, Space, Spin } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { apiClient } from '../api/client';
import { Statistics as StatisticsType } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;

type Period = 'today' | 'week' | 'month';

const Statistics = () => {
  const [period, setPeriod] = useState<Period>('today');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => apiClient.getStatistics(),
  });

  const periodData = stats
    ? {
        today: stats.today,
        week: stats.week,
        month: stats.month,
      }[period]
    : null;

  const handleExportCSV = () => {
    if (!stats) return;

    const csvData = [
      ['Период', 'Проверено', 'Одобрено', 'Отклонено', 'На доработке', 'Ср. время (мин)'],
      [
        'Сегодня',
        stats.today.checked,
        stats.today.approved,
        stats.today.rejected,
        stats.today.rework,
        stats.today.avgTime,
      ],
      [
        'Неделя',
        stats.week.checked,
        stats.week.approved,
        stats.week.rejected,
        stats.week.rework,
        stats.week.avgTime,
      ],
      [
        'Месяц',
        stats.month.checked,
        stats.month.approved,
        stats.month.rejected,
        stats.month.rework,
        stats.month.avgTime,
      ],
    ];

    const csvContent = csvData.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `statistics_${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Spin size="large" style={{ display: 'block', textAlign: 'center', padding: 50 }} />
    );
  }

  if (!stats) {
    return null;
  }

  const approvedPercent =
    periodData && periodData.checked > 0
      ? Math.round((periodData.approved / periodData.checked) * 100)
      : 0;
  const rejectedPercent =
    periodData && periodData.checked > 0
      ? Math.round((periodData.rejected / periodData.checked) * 100)
      : 0;

  const decisionData = periodData
    ? [
        { name: 'Одобрено', value: periodData.approved, color: '#52c41a' },
        { name: 'Отклонено', value: periodData.rejected, color: '#ff4d4f' },
        { name: 'На доработке', value: periodData.rework, color: '#faad14' },
      ].filter((item) => item.value > 0)
    : [];

  const activityData = stats.activityByDay.map((item) => ({
    date: dayjs(item.date).format('DD.MM'),
    count: item.count,
  }));

  const categoryData = stats.byCategory.map((item) => ({
    category: item.category,
    count: item.count,
  }));

  const COLORS = ['#52c41a', '#ff4d4f', '#faad14'];

  return (
    <div>
      <Card
        title="Статистика модератора"
        extra={
          <Space>
            <Select
              value={period}
              onChange={(value) => setPeriod(value)}
              style={{ width: 150 }}
            >
              <Option value="today">Сегодня</Option>
              <Option value="week">7 дней</Option>
              <Option value="month">30 дней</Option>
            </Select>
            <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
              Экспорт CSV
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Проверено"
                value={periodData?.checked || 0}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Одобрено"
                value={approvedPercent}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Отклонено"
                value={rejectedPercent}
                suffix="%"
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Ср. время"
                value={periodData?.avgTime || 0}
                suffix="мин"
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="График активности (7 дней)" style={{ marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#1890ff" name="Проверено объявлений" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Распределение решений" style={{ marginBottom: 24 }}>
            {decisionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={decisionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {decisionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: 50 }}>
                Нет данных за выбранный период
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Распределение по категориям">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="category" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#722ed1" name="Количество объявлений" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default Statistics;

