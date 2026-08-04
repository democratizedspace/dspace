import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Page } from '../frontend/e2e/test-helpers';
import { navigateWithRetry } from '../frontend/e2e/test-helpers';

type MockPage = Page & {
  goto: ReturnType<typeof vi.fn>;
  waitForTimeout: ReturnType<typeof vi.fn>;
};

function timeoutError(message = 'page.goto: Timeout 15000ms exceeded.'): Error {
  const error = new Error(message);
  error.name = 'TimeoutError';
  return error;
}

function createMockPage(results: Array<unknown>): MockPage {
  const queue = [...results];
  const goto = vi.fn(async () => {
    const next = queue.shift();
    if (next instanceof Error) {
      throw next;
    }
  });

  const waitForTimeout = vi.fn().mockResolvedValue(undefined);

  return {
    goto,
    waitForTimeout,
  } as unknown as MockPage;
}

function createClock(start = 0): {
  now: () => number;
  sleep: (ms: number) => Promise<void>;
} {
  let current = start;
  return {
    now: () => current,
    sleep: vi.fn(async (ms: number) => {
      current += ms;
    }),
  };
}

describe('navigateWithRetry', () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  afterEach(() => {
    consoleWarnSpy.mockClear();
  });

  it('retries a navigation timeout before succeeding', async () => {
    const page = createMockPage([timeoutError(), undefined]);
    const clock = createClock();

    await expect(
      navigateWithRetry(page, '/', {
        delayMs: 50,
        now: clock.now,
        sleep: clock.sleep,
      })
    ).resolves.toBeUndefined();

    expect(page.goto).toHaveBeenCalledTimes(2);
    expect(page.goto).toHaveBeenNthCalledWith(1, '/', {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    });
    expect(clock.sleep).toHaveBeenCalledWith(50);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Retrying navigation to / after navigation timeout (attempt 1 of 6)'
    );
  });

  it('retries a narrowly matched Playwright timeout message before succeeding', async () => {
    const page = createMockPage([
      new Error('page.goto: Timeout 15000ms exceeded.'),
      undefined,
    ]);
    const clock = createClock();

    await navigateWithRetry(page, '/', {
      delayMs: 1,
      now: clock.now,
      sleep: clock.sleep,
    });

    expect(page.goto).toHaveBeenCalledTimes(2);
  });

  it('retries connection refusal before succeeding', async () => {
    const page = createMockPage([
      new Error('page.goto: net::ERR_CONNECTION_REFUSED'),
      undefined,
    ]);
    const clock = createClock();

    await navigateWithRetry(page, 'http://127.0.0.1:3000', {
      delayMs: 25,
      now: clock.now,
      sleep: clock.sleep,
    });

    expect(page.goto).toHaveBeenCalledTimes(2);
    expect(clock.sleep).toHaveBeenCalledWith(25);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Retrying navigation to http://127.0.0.1:3000 after connection refusal (attempt 1 of 6)'
    );
  });

  it('returns after a successful first attempt without retrying or sleeping', async () => {
    const page = createMockPage([undefined]);
    const clock = createClock();

    await navigateWithRetry(page, '/', { now: clock.now, sleep: clock.sleep });

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(clock.sleep).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('fails immediately for non-retryable navigation errors', async () => {
    const navigationError = new Error(
      'page.goto: net::ERR_CERT_AUTHORITY_INVALID'
    );
    const page = createMockPage([navigationError, undefined]);
    const clock = createClock();

    await expect(
      navigateWithRetry(page, '/', { now: clock.now, sleep: clock.sleep })
    ).rejects.toThrow(navigationError);

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(clock.sleep).not.toHaveBeenCalled();
  });

  it('bounds the per-attempt timeout by the remaining overall duration', async () => {
    let current = 1_000;
    const now = vi.fn(() => current);
    const page = createMockPage([undefined]);

    await navigateWithRetry(page, '/', {
      maxDurationMs: 10_000,
      perAttemptTimeoutMs: 15_000,
      now,
      sleep: vi.fn(),
    });

    expect(page.goto).toHaveBeenCalledWith('/', {
      waitUntil: 'domcontentloaded',
      timeout: 10_000,
    });
  });

  it('does not sleep or begin another attempt when backoff would exhaust the budget', async () => {
    let current = 0;
    const page = createMockPage([timeoutError(), undefined]);
    page.goto.mockImplementationOnce(async () => {
      current = 9_960;
      throw timeoutError();
    });
    const sleep = vi.fn(async (ms: number) => {
      current += ms;
    });

    await expect(
      navigateWithRetry(page, '/', {
        delayMs: 50,
        maxDurationMs: 10_000,
        now: () => current,
        sleep,
      })
    ).rejects.toThrow('insufficient budget for 50ms retry backoff');

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('does not begin another attempt after duration exhaustion', async () => {
    let current = 0;
    const page = createMockPage([timeoutError(), undefined]);
    page.goto.mockImplementationOnce(async () => {
      current = 10_000;
      throw timeoutError();
    });
    const sleep = vi.fn();

    await expect(
      navigateWithRetry(page, '/', {
        delayMs: 1,
        maxDurationMs: 10_000,
        now: () => current,
        sleep,
      })
    ).rejects.toThrow('limit 10000ms');

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('stops after the configured attempt count is exhausted', async () => {
    const page = createMockPage([timeoutError(), timeoutError(), undefined]);
    const clock = createClock();

    await expect(
      navigateWithRetry(page, '/', {
        attempts: 2,
        delayMs: 1,
        now: clock.now,
        sleep: clock.sleep,
      })
    ).rejects.toThrow('after 2 attempts');

    expect(page.goto).toHaveBeenCalledTimes(2);
    expect(clock.sleep).toHaveBeenCalledTimes(1);
  });

  it('suppresses retry logs after the configured visible retry count', async () => {
    const page = createMockPage([
      new Error('net::ERR_CONNECTION_REFUSED'),
      new Error('net::ERR_CONNECTION_REFUSED'),
      new Error('net::ERR_CONNECTION_REFUSED'),
      undefined,
    ]);
    const clock = createClock();

    await navigateWithRetry(page, '/', {
      attempts: 4,
      delayMs: 1,
      maxLogAttempts: 1,
      now: clock.now,
      sleep: clock.sleep,
    });

    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenNthCalledWith(
      1,
      'Retrying navigation to / after connection refusal (attempt 1 of 4)'
    );
    expect(consoleWarnSpy).toHaveBeenNthCalledWith(
      2,
      'Suppressing further retry logs for /; attempts 2-4 will retry silently'
    );
  });
});
