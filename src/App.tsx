import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import AppHeader from './components/AppHeader';
import AdsList from './pages/AdsList';
import AdDetail from './pages/AdDetail';
import Statistics from './pages/Statistics';

const { Content } = Layout;

function App() {
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        <AppHeader />
        <Content
          style={{
            padding: '24px',
            background: 'transparent',
            transition: 'opacity 0.3s ease-in',
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/list" replace />} />
            <Route path="/list" element={<AdsList />} />
            <Route path="/item/:id" element={<AdDetail />} />
            <Route path="/stats" element={<Statistics />} />
          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
