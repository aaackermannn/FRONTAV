import { Layout, Button, Switch, Typography, Space } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, BarChartOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useTheme } from '../hooks/useTheme';

const { Header } = Layout;
const { Title } = Typography;

/**
 * Компонент шапки приложения
 * Содержит навигационные кнопки и переключатель темы
 */
const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        gap: '16px',
      }}
    >
      <Title level={3} style={{ margin: 0, color: '#ffffff' }}>
        Модерация объявлений
      </Title>
      <Space size="middle">
        <Button
          type={location.pathname === '/list' ? 'primary' : 'default'}
          icon={<HomeOutlined />}
          onClick={() => navigate('/list')}
        >
          Список объявлений
        </Button>
        <Button
          type={location.pathname === '/stats' ? 'primary' : 'default'}
          icon={<BarChartOutlined />}
          onClick={() => navigate('/stats')}
        >
          Статистика
        </Button>
        <Switch
          checked={isDark}
          onChange={toggleTheme}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
        />
      </Space>
    </Header>
  );
};

export default AppHeader;
