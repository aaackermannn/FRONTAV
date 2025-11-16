import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Select, Button, Space, Spin } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DownloadOutlined,
  FilePdfOutlined,
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
import dayjs from 'dayjs';

const { Option } = Select;

type Period = 'today' | 'week' | 'month';

const Statistics = () => {
  const [period, setPeriod] = useState<Period>('today');

  const { data: summaryStats, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['summaryStats', period],
    queryFn: () => apiClient.getSummaryStats(period),
  });

  const { data: activityChart, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['activityChart', period],
    queryFn: () => apiClient.getActivityChart(period),
  });

  const { data: decisionsChart, isLoading: isLoadingDecisions } = useQuery({
    queryKey: ['decisionsChart', period],
    queryFn: () => apiClient.getDecisionsChart(period),
  });

  const { data: categoriesChart, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categoriesChart', period],
    queryFn: () => apiClient.getCategoriesChart(period),
  });

  const isLoading =
    isLoadingSummary || isLoadingActivity || isLoadingDecisions || isLoadingCategories;

  const handleExportCSV = () => {
    if (!summaryStats) return;

    const csvData = [
      ['Период', 'Проверено', 'Одобрено %', 'Отклонено %', 'На доработке %', 'Ср. время (сек)'],
      [
        period === 'today' ? 'Сегодня' : period === 'week' ? '7 дней' : '30 дней',
        summaryStats.totalReviewed,
        summaryStats.approvedPercentage.toFixed(2),
        summaryStats.rejectedPercentage.toFixed(2),
        summaryStats.requestChangesPercentage.toFixed(2),
        summaryStats.averageReviewTime,
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

  const handleExportPDF = () => {
    if (!summaryStats) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Статистика модератора - ${dayjs().format('DD.MM.YYYY')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1890ff; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
          </style>
        </head>
        <body>
          <h1>Статистика модератора</h1>
          <p>Дата отчёта: ${dayjs().format('DD.MM.YYYY HH:mm')}</p>
          <p>Период: ${period === 'today' ? 'Сегодня' : period === 'week' ? '7 дней' : '30 дней'}</p>
          <table>
            <tr>
              <th>Метрика</th>
              <th>Значение</th>
            </tr>
            <tr>
              <td>Проверено</td>
              <td>${summaryStats.totalReviewed}</td>
            </tr>
            <tr>
              <td>Одобрено</td>
              <td>${summaryStats.approvedPercentage.toFixed(2)}%</td>
            </tr>
            <tr>
              <td>Отклонено</td>
              <td>${summaryStats.rejectedPercentage.toFixed(2)}%</td>
            </tr>
            <tr>
              <td>На доработке</td>
              <td>${summaryStats.requestChangesPercentage.toFixed(2)}%</td>
            </tr>
            <tr>
              <td>Ср. время проверки</td>
              <td>${summaryStats.averageReviewTime} сек</td>
            </tr>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', textAlign: 'center', padding: 50 }} />;
  }

  if (!summaryStats || !activityChart || !decisionsChart || !categoriesChart) {
    return null;
  }

  const totalReviewed =
    period === 'today'
      ? summaryStats.totalReviewedToday
      : period === 'week'
        ? summaryStats.totalReviewedThisWeek
        : summaryStats.totalReviewedThisMonth;

  const decisionData = [
    {
      name: 'Одобрено',
      value: decisionsChart.approved,
      color: '#52c41a',
    },
    {
      name: 'Отклонено',
      value: decisionsChart.rejected,
      color: '#ff4d4f',
    },
    {
      name: 'На доработке',
      value: decisionsChart.requestChanges,
      color: '#faad14',
    },
  ].filter((item) => item.value > 0);

  const activityData = activityChart.map((item) => ({
    date: dayjs(item.date).format('DD.MM'),
    approved: item.approved,
    rejected: item.rejected,
    requestChanges: item.requestChanges,
  }));

  const categoryData = Object.entries(categoriesChart).map(([category, count]) => ({
    category,
    count,
  }));

  const COLORS = ['#52c41a', '#ff4d4f', '#faad14'];

  return (
    <div>
      <Card
        title="Статистика модератора"
        extra={
          <Space>
            <Select value={period} onChange={(value) => setPeriod(value)} style={{ width: 150 }}>
              <Option value="today">Сегодня</Option>
              <Option value="week">7 дней</Option>
              <Option value="month">30 дней</Option>
            </Select>
            <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
              CSV
            </Button>
            <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>
              PDF
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Проверено" value={totalReviewed} prefix={<FileTextOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Одобрено"
                value={summaryStats.approvedPercentage.toFixed(1)}
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
                value={summaryStats.rejectedPercentage.toFixed(1)}
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
                value={summaryStats.averageReviewTime}
                suffix="сек"
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="График активности" style={{ marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" stackId="a" fill="#52c41a" name="Одобрено" />
                <Bar dataKey="rejected" stackId="a" fill="#ff4d4f" name="Отклонено" />
                <Bar dataKey="requestChanges" stackId="a" fill="#faad14" name="На доработке" />
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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {decisionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: 50 }}>Нет данных за выбранный период</div>
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
