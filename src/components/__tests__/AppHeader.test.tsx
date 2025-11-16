import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppHeader from '../AppHeader';

// Мокаем useTheme
vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    isDark: false,
    toggleTheme: vi.fn(),
  }),
}));

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('должен отображать заголовок приложения', () => {
    renderWithRouter(<AppHeader />);

    expect(screen.getByText('Модерация объявлений')).toBeInTheDocument();
  });

  it('должен отображать ссылку на список объявлений', () => {
    renderWithRouter(<AppHeader />);

    const listLink = screen.getByText('Список объявлений');
    expect(listLink).toBeInTheDocument();
    expect(listLink.closest('a')).toHaveAttribute('href', '/list');
  });

  it('должен отображать ссылку на статистику', () => {
    renderWithRouter(<AppHeader />);

    const statsLink = screen.getByText('Статистика');
    expect(statsLink).toBeInTheDocument();
    expect(statsLink.closest('a')).toHaveAttribute('href', '/stats');
  });

  it('должен отображать переключатель темы', () => {
    renderWithRouter(<AppHeader />);

    const themeSwitch = screen.getByRole('switch');
    expect(themeSwitch).toBeInTheDocument();
  });
});
