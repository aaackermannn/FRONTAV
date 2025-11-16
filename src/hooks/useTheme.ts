import { useState, useEffect } from 'react';

/**
 * Хук для управления темой приложения (светлая/тёмная)
 * Сохраняет выбор пользователя в localStorage и синхронизирует
 * между компонентами через событие 'themechange'
 *
 * @returns Объект с текущим состоянием темы и функцией переключения
 *
 * @example
 * const { isDark, toggleTheme } = useTheme();
 * <Switch checked={isDark} onChange={toggleTheme} />
 */
export const useTheme = () => {
  // Инициализируем состояние из localStorage при первой загрузке
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  // Сохраняем выбор в localStorage и уведомляем другие компоненты
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    // Отправляем событие для синхронизации темы в других компонентах
    window.dispatchEvent(new Event('themechange'));
  }, [isDark]);

  /**
   * Переключает тему между светлой и тёмной
   */
  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return { isDark, toggleTheme };
};
