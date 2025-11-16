/**
 * Настройка тестовой среды
 * Выполняется перед каждым тестом
 */

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Очистка DOM после каждого теста
afterEach(() => {
  cleanup();
});
