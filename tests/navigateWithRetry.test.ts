import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Page } from '../frontend/e2e/test-helpers';
import { navigateWithRetry } from '../frontend/e2e/test-helpers';

type GotoResult = Awaited<ReturnType<Page['goto']>>;

function timeoutError(message = 'page.goto: Timeout 15000ms exceeded.'): Error {
  const error = new Error(message);
  error.name = 'TimeoutError';
  return error;
}

function createPage(
  outcomes: Array<Error | undefined>,
  onGoto?: () => void
): Page {
  const goto = vi.fn(async () => {
    onGoto?.();
    const outcome = outcomes.shift();
    if (outcome) {
      throw outcome;
    }
    return undefined as GotoResult;
  });

  const waitForTimeout = vi.fn(
    async () => undefined as Awaited<ReturnType<Page['waitForTimeout']>>
  );

  return { goto, waitForTimeout } as unknown as Page;
}

describe('navigateWithRetry', () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  afterEach(() => {
    consoleWarnSpy.mockClear();
  });

  it('retries a Playwright navigation timeout before succeeding', async () => {
    let currentTime = 0;
    const page = createPage([timeoutError(), undefined]);

    await navigateWithRetry(page, '/', {
      attempts: 2,
      delayMs: 100,
      maxDurationMs: 20_000,
      now: () => currentTime,
      sleep: async (ms) => {
        currentTime += ms;
      },
    });

    expect(page.goto).toHaveBeenCalledTimes(2);
    expect(page.goto).toHaveBeenNthCalledWith(1, '/', {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    });
    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });

  it('retries connection refusal before succeeding', async () => {
    let currentTime = 0;
    const page = createPage([
      new Error('page.goto: net::ERR_CONNECTION_REFUSED'),
      undefined,
    ]);

    await navigateWithRetry(page, '/', {
      attempts: 2,
      delayMs: 25,
      now: () => currentTime,
      sleep: async (ms) => {
        currentTime += ms;
      },
    });

    expect(page.goto).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
  });

  it('does not retry a successful first navigation', async () => {
    const page = createPage([undefined]);

    await navigateWithRetry(page, '/');

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(page.waitForTimeout).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('fails non-retryable navigation errors immediately', async () => {
    const error = new Error('page.goto: net::ERR_CERT_AUTHORITY_INVALID');
    const page = createPage([error, undefined]);

    await expect(navigateWithRetry(page, '/', { attempts: 3 })).rejects.toThrow(
      error
    );

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(page.waitForTimeout).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('bounds each navigation timeout by the remaining overall duration', async () => {
    let currentTime = 7_500;
    const page = createPage([undefined]);

    await navigateWithRetry(page, '/', {
      maxDurationMs: 10_000,
      now: () => currentTime,
    });

    expect(page.goto).toHaveBeenCalledWith('/', {
      waitUntil: 'domcontentloaded',
      timeout: 10_000,
    });
  });

  it('does not start another attempt when the duration budget is exhausted', async () => {
    let currentTime = 0;
    const page = createPage([timeoutError(), undefined], () => {
      currentTime = 15_000;
    });

    await expect(
      navigateWithRetry(page, '/', {
        attempts: 3,
        delayMs: 100,
        maxDurationMs: 15_000,
        now: () => currentTime,
        sleep: async (ms) => {
          currentTime += ms;
        },
      })
    ).rejects.toThrow('limit 15000ms');

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });

  it('does not sleep when the next backoff does not fit in the remaining budget', async () => {
    let nowCalls = 0;
    const page = createPage([new Error('ECONNREFUSED'), undefined]);

    await expect(
      navigateWithRetry(page, '/', {
        attempts: 3,
        delayMs: 100,
        maxDurationMs: 10_000,
        now: () => (nowCalls++ === 0 ? 0 : 9_950),
        sleep: async () => {
          throw new Error('sleep should not be called');
        },
      })
    ).rejects.toThrow('limit 10000ms');

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });

  it('fails after bounded attempt-count exhaustion', async () => {
    let currentTime = 0;
    const page = createPage([
      new Error('ECONNREFUSED'),
      new Error('ECONNREFUSED'),
      undefined,
    ]);

    await expect(
      navigateWithRetry(page, '/', {
        attempts: 2,
        delayMs: 1,
        maxDurationMs: 10_000,
        now: () => currentTime,
        sleep: async (ms) => {
          currentTime += ms;
        },
      })
    ).rejects.toThrow('after 2 attempts');

    expect(page.goto).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
  });

  it('suppresses retry logs after the configured log limit', async () => {
    let currentTime = 0;
    const page = createPage([
      new Error('ECONNREFUSED'),
      new Error('ECONNREFUSED'),
      new Error('ECONNREFUSED'),
      undefined,
    ]);

    await navigateWithRetry(page, '/', {
      attempts: 4,
      delayMs: 1,
      maxLogAttempts: 1,
      maxDurationMs: 10_000,
      now: () => currentTime,
      sleep: async (ms) => {
        currentTime += ms;
      },
    });

    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy.mock.calls[1]?.[0]).toContain(
      'Suppressing further retry logs'
    );
  });
});
