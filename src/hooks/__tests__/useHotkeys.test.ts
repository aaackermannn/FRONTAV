import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHotkeys, HotkeyConfig } from '../useHotkeys';

describe('useHotkeys', () => {
  let handler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handler = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('должен вызывать обработчик при нажатии указанной клавиши', () => {
    const configs: HotkeyConfig[] = [
      {
        key: 'a',
        handler,
      },
    ];

    renderHook(() => useHotkeys(configs));

    const event = new KeyboardEvent('keydown', { key: 'a' });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('не должен вызывать обработчик при нажатии другой клавиши', () => {
    const configs: HotkeyConfig[] = [
      {
        key: 'a',
        handler,
      },
    ];

    renderHook(() => useHotkeys(configs));

    const event = new KeyboardEvent('keydown', { key: 'b' });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('должен игнорировать горячие клавиши при вводе в input', () => {
    const configs: HotkeyConfig[] = [
      {
        key: 'a',
        handler,
      },
    ];

    renderHook(() => useHotkeys(configs));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: 'a' });
    input.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('должен разрешать клавишу "/" даже при вводе в input', () => {
    const searchHandler = vi.fn();
    const configs: HotkeyConfig[] = [
      {
        key: '/',
        handler: searchHandler,
      },
    ];

    renderHook(() => useHotkeys(configs));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    // Создаём событие с правильным target
    const event = new KeyboardEvent('keydown', {
      key: '/',
      bubbles: true,
      cancelable: true,
    });

    // Устанавливаем target вручную, так как dispatchEvent не устанавливает его автоматически
    Object.defineProperty(event, 'target', {
      value: input,
      enumerable: true,
    });

    window.dispatchEvent(event);

    expect(searchHandler).toHaveBeenCalledTimes(1);

    document.body.removeChild(input);
  });

  it('не должен вызывать обработчик когда хук отключен', () => {
    const configs: HotkeyConfig[] = [
      {
        key: 'a',
        handler,
      },
    ];

    renderHook(() => useHotkeys(configs, false));

    const event = new KeyboardEvent('keydown', { key: 'a' });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('должен обрабатывать несколько горячих клавиш', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const configs: HotkeyConfig[] = [
      { key: 'a', handler: handler1 },
      { key: 'b', handler: handler2 },
    ];

    renderHook(() => useHotkeys(configs));

    const event1 = new KeyboardEvent('keydown', { key: 'a' });
    window.dispatchEvent(event1);

    const event2 = new KeyboardEvent('keydown', { key: 'b' });
    window.dispatchEvent(event2);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('должен очищать обработчики при размонтировании', () => {
    const configs: HotkeyConfig[] = [
      {
        key: 'a',
        handler,
      },
    ];

    const { unmount } = renderHook(() => useHotkeys(configs));

    unmount();

    const event = new KeyboardEvent('keydown', { key: 'a' });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });
});
