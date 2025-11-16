import { useEffect } from 'react';

/**
 * Конфигурация горячей клавиши
 */
export interface HotkeyConfig {
  /** Клавиша для активации (например, 'a', 'ArrowRight', '/') */
  key: string;
  /** Функция-обработчик, вызываемая при нажатии клавиши */
  handler: () => void;
  /** Требуется ли нажатие Ctrl (по умолчанию false) */
  ctrl?: boolean;
  /** Требуется ли нажатие Shift (по умолчанию false) */
  shift?: boolean;
  /** Требуется ли нажатие Alt (по умолчанию false) */
  alt?: boolean;
}

/**
 * Маппинг символов клавиш в их физические коды
 * Используется для работы горячих клавиш независимо от раскладки клавиатуры
 */
const keyToCodeMap: Record<string, string> = {
  a: 'KeyA',
  b: 'KeyB',
  c: 'KeyC',
  d: 'KeyD',
  e: 'KeyE',
  f: 'KeyF',
  g: 'KeyG',
  h: 'KeyH',
  i: 'KeyI',
  j: 'KeyJ',
  k: 'KeyK',
  l: 'KeyL',
  m: 'KeyM',
  n: 'KeyN',
  o: 'KeyO',
  p: 'KeyP',
  q: 'KeyQ',
  r: 'KeyR',
  s: 'KeyS',
  t: 'KeyT',
  u: 'KeyU',
  v: 'KeyV',
  w: 'KeyW',
  x: 'KeyX',
  y: 'KeyY',
  z: 'KeyZ',
};

/**
 * Хук для обработки глобальных горячих клавиш
 * Позволяет назначать обработчики на комбинации клавиш
 * Работает независимо от раскладки клавиатуры для буквенных клавиш
 *
 * @param configs - массив конфигураций горячих клавиш
 * @param enabled - флаг включения/выключения обработки (по умолчанию true)
 *
 * @example
 * useHotkeys([
 *   { key: 'a', handler: () => approve() },
 *   { key: 'ArrowRight', handler: () => next() }
 * ]);
 */
export const useHotkeys = (configs: HotkeyConfig[], enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const config of configs) {
        // Для буквенных клавиш используем event.code для работы независимо от раскладки
        // Для остальных клавиш (стрелки, '/') используем event.key
        const configKeyLower = config.key.toLowerCase();
        let keyMatch = false;

        if (keyToCodeMap[configKeyLower]) {
          // Буквенная клавиша - проверяем по коду
          keyMatch = event.code === keyToCodeMap[configKeyLower];
        } else {
          // Специальная клавиша - проверяем по символу
          keyMatch = event.key.toLowerCase() === configKeyLower;
        }

        const ctrlMatch = config.ctrl ? event.ctrlKey : !event.ctrlKey;
        const shiftMatch = config.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = config.alt ? event.altKey : !event.altKey;

        // Игнорируем горячие клавиши при вводе текста (кроме '/' для поиска)
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          if (config.key !== '/') continue;
        }

        // Проверяем совпадение всех условий
        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          config.handler();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [configs, enabled]);
};
