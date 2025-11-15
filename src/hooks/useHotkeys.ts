import { useEffect } from 'react';

export interface HotkeyConfig {
  key: string;
  handler: () => void;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export const useHotkeys = (configs: HotkeyConfig[], enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const config of configs) {
        const keyMatch = event.key.toLowerCase() === config.key.toLowerCase();
        const ctrlMatch = config.ctrl ? event.ctrlKey : !event.ctrlKey;
        const shiftMatch = config.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = config.alt ? event.altKey : !event.altKey;

        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          if (config.key !== '/') continue;
        }

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

