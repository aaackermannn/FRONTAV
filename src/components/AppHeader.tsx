import { Layout, Menu, Switch, Typography, Space } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { HomeOutlined, BarChartOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useTheme } from '../hooks/useTheme';

const { Header } = Layout;
const { Title } = Typography;

const AppHeader = () => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const menuItems = [
    {
      key: '/list',
      icon: <HomeOutlined />,
      label: <Link to="/list">Список объявлений</Link>,
    },
    {
      key: '/stats',
      icon: <BarChartOutlined />,
      label: <Link to="/stats">Статистика</Link>,
    },
  ];

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      <Title level={3} style={{ margin: 0, color: 'inherit' }}>
        Модерация объявлений
      </Title>
      <Space>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ minWidth: 300, border: 'none' }}
        />
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

