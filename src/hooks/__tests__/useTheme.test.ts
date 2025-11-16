import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('должен инициализироваться со светлой темой по умолчанию', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(false);
  });

  it('должен загружать сохранённую тёмную тему из localStorage', () => {
    localStorage.setItem('theme', 'dark');

    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(true);
  });

  it('должен сохранять выбор темы в localStorage', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorage.getItem('theme')).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('должен отправлять событие themechange при изменении темы', () => {
    // Очищаем localStorage перед тестом, чтобы избежать события при инициализации
    localStorage.clear();

    const eventListener = vi.fn();
    window.addEventListener('themechange', eventListener);

    const { result } = renderHook(() => useTheme());

    // Очищаем вызовы от инициализации (если были)
    eventListener.mockClear();

    act(() => {
      result.current.toggleTheme();
    });

    // Событие должно быть вызвано один раз при изменении темы
    expect(eventListener).toHaveBeenCalledTimes(1);

    window.removeEventListener('themechange', eventListener);
  });

  it('должен переключать тему между светлой и тёмной', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(false);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDark).toBe(true);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDark).toBe(false);
  });
});
