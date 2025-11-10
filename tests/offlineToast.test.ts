import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installOfflineToast } from '../frontend/src/scripts/offlineToast.js';

const originalOnLineDescriptor = Object.getOwnPropertyDescriptor(
  Navigator.prototype,
  'onLine'
);

function setNavigatorOnlineState(value: boolean) {
  Object.defineProperty(Navigator.prototype, 'onLine', {
    configurable: true,
    get: () => value,
  });
}

describe('installOfflineToast', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    setNavigatorOnlineState(true);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    if (originalOnLineDescriptor) {
      Object.defineProperty(
        Navigator.prototype,
        'onLine',
        originalOnLineDescriptor
      );
    }
  });

  it('shows a status toast immediately when offline on load', () => {
    setNavigatorOnlineState(false);
    const { element, destroy } = installOfflineToast();
    expect(element).toBeTruthy();
    expect(element?.getAttribute('role')).toBe('status');
    expect(element?.getAttribute('aria-live')).toBe('polite');
    expect(getComputedStyle(element as HTMLElement).display).toBe('block');
    destroy();
  });

  it('reveals and hides the toast in response to offline events', () => {
    const { element, destroy } = installOfflineToast({
      hideDelayMs: 0,
      onlineHideDelayMs: 0,
    });
    expect(getComputedStyle(element).display).toBe('none');

    window.dispatchEvent(new Event('offline'));
    expect(getComputedStyle(element).display).toBe('block');

    window.dispatchEvent(new Event('online'));
    expect(getComputedStyle(element).display).toBe('none');
    destroy();
  });

  it('announces when the connection is restored before hiding', () => {
    const onlineMessage = "You're back online. Changes are syncing now.";
    const { element, destroy } = installOfflineToast({
      onlineHideDelayMs: 1000,
      onlineMessage,
    });

    window.dispatchEvent(new Event('offline'));
    expect(element.textContent).not.toBe(onlineMessage);

    window.dispatchEvent(new Event('online'));
    expect(element.textContent).toBe(onlineMessage);
    expect(getComputedStyle(element).display).toBe('block');

    vi.advanceTimersByTime(999);
    expect(getComputedStyle(element).display).toBe('block');

    vi.advanceTimersByTime(1);
    expect(getComputedStyle(element).display).toBe('none');
    destroy();
  });
});
