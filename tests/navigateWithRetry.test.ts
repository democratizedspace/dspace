import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import type { Page } from '../frontend/e2e/test-helpers';
import { navigateWithRetry } from '../frontend/e2e/test-helpers';

type MockPage = Page & {
  goto: ReturnType<typeof vi.fn>;
  waitForTimeout: ReturnType<typeof vi.fn>;
};

function createMockPage(outcomes: Array<unknown | 'success'>): MockPage {
  const pendingOutcomes = [...outcomes];
  const goto = vi.fn(async () => {
    const outcome = pendingOutcomes.shift() ?? 'success';
    if (outcome !== 'success') {
      throw outcome;
    }
  });

  const waitForTimeout = vi.fn().mockResolvedValue(undefined);

  return {
    goto,
    waitForTimeout,
  } as unknown as MockPage;
}

function createTimeoutError(
  message = 'page.goto: Timeout 15000ms exceeded.'
): Error {
  const error = new Error(message);
  error.name = 'TimeoutError';
  return error;
}

describe('navigateWithRetry', () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  afterEach(() => {
    consoleWarnSpy.mockClear();
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
  });

  it('retries a Playwright navigation timeout before succeeding', async () => {
    const page = createMockPage([createTimeoutError(), 'success']);

    await expect(
      navigateWithRetry(page, '/', {
        attempts: 2,
        delayMs: 300,
        maxDurationMs: 20_000,
      })
    ).resolves.toBeUndefined();

    expect(page.goto).toHaveBeenCalledTimes(2);
    expect(page.waitForTimeout).toHaveBeenCalledWith(300);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Retrying navigation to / after timeout (attempt 1 of 2)'
    );
  });

  it('retries the stable Playwright goto timeout message shape before succeeding', async () => {
    const page = createMockPage([
      new Error('page.goto: Timeout 15000ms exceeded.'),
      'success',
    ]);

    await expect(
      navigateWithRetry(page, '/', {
        attempts: 2,
        delayMs: 1,
        maxDurationMs: 20_000,
      })
    ).resolves.toBeUndefined();

    expect(page.goto).toHaveBeenCalledTimes(2);
  });

  it('retries the stable Playwright goto timeout message with a call log before succeeding', async () => {
    const page = createMockPage([
      new Error(
        'page.goto: Timeout 15000ms exceeded.\nCall log:\n  - navigating to "/"'
      ),
      'success',
    ]);

    await expect(
      navigateWithRetry(page, '/', {
        attempts: 2,
        delayMs: 1,
        maxDurationMs: 20_000,
      })
    ).resolves.toBeUndefined();

    expect(page.goto).toHaveBeenCalledTimes(2);
  });

  it('does not retry a near-match Playwright goto timeout message with unrelated trailing text', async () => {
    const page = createMockPage([
      new Error('page.goto: Timeout 15000ms exceeded. unrelated trailing text'),
      'success',
    ]);

    await expect(
      navigateWithRetry(page, '/', {
        attempts: 2,
        delayMs: 1,
        maxDurationMs: 20_000,
      })
    ).rejects.toThrow('after 1 attempt');

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });

  it('does not retry the legacy navigation timeout message', async () => {
    const page = createMockPage([
      new Error('page.goto: Navigation timeout of 30000ms exceeded'),
      'success',
    ]);

    await expect(
      navigateWithRetry(page, '/', {
        attempts: 2,
        delayMs: 1,
        maxDurationMs: 20_000,
      })
    ).rejects.toThrow('after 1 attempt');

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });

  it('retries connection refusal before succeeding', async () => {
    const page = createMockPage([
      new Error('net::ERR_CONNECTION_REFUSED'),
      'success',
    ]);

    await expect(
      navigateWithRetry(page, 'http://127.0.0.1:3000', {
        attempts: 2,
        delayMs: 1,
        maxDurationMs: 10_000,
      })
    ).resolves.toBeUndefined();

    expect(page.goto).toHaveBeenCalledTimes(2);
    expect(page.waitForTimeout).toHaveBeenCalledTimes(1);
  });

  it('succeeds on the first attempt without sleeping or logging', async () => {
    const page = createMockPage(['success']);

    await expect(navigateWithRetry(page, '/')).resolves.toBeUndefined();

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(page.waitForTimeout).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('fails non-retryable navigation errors immediately', async () => {
    const navigationError = new Error(
      'page.goto: net::ERR_CERT_AUTHORITY_INVALID'
    );
    const page = createMockPage([navigationError, 'success']);

    await expect(navigateWithRetry(page, '/')).rejects.toThrow(navigationError);

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });

  it('bounds each page.goto timeout by the remaining overall duration', async () => {
    let nowMs = 1_000;
    const page = createMockPage(['success']);
    page.goto.mockImplementationOnce(async () => {
      nowMs += 7_000;
      throw createTimeoutError();
    });
    page.waitForTimeout.mockImplementationOnce(async (ms: number) => {
      nowMs += ms;
    });

    await expect(
      navigateWithRetry(page, '/', {
        attempts: 2,
        delayMs: 100,
        maxDurationMs: 10_000,
        attemptTimeoutMs: 20_000,
        now: () => nowMs,
      })
    ).resolves.toBeUndefined();

    expect(page.waitForTimeout).toHaveBeenCalledWith(100);
    expect(page.goto).toHaveBeenNthCalledWith(1, '/', {
      waitUntil: 'domcontentloaded',
      timeout: 10_000,
    });
    expect(page.goto).toHaveBeenNthCalledWith(2, '/', {
      waitUntil: 'domcontentloaded',
      timeout: 2_900,
    });
  });

  it.each([
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])(
    'rejects invalid attemptTimeoutMs value %s before attempting navigation',
    async (attemptTimeoutMs) => {
      const page = createMockPage(['success']);

      await expect(
        navigateWithRetry(page, '/', {
          attemptTimeoutMs,
        })
      ).rejects.toThrow('attemptTimeoutMs must be a finite positive number');

      expect(page.goto).not.toHaveBeenCalled();
      expect(page.waitForTimeout).not.toHaveBeenCalled();
    }
  );

  it('does not sleep or begin another attempt when the retry backoff would exhaust the budget', async () => {
    let nowMs = 0;
    const page = createMockPage([createTimeoutError(), 'success']);
    page.goto.mockImplementationOnce(async () => {
      nowMs = 950;
      throw createTimeoutError();
    });

    await expect(
      navigateWithRetry(page, '/', {
        attempts: 2,
        delayMs: 100,
        maxDurationMs: 1_000,
        now: () => nowMs,
      })
    ).rejects.toThrow('limit 1000ms');

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });

  it('stops after exhausting the configured attempt count', async () => {
    const page = createMockPage([
      new Error('page.goto: net::ERR_CONNECTION_REFUSED'),
      createTimeoutError(),
      'success',
    ]);

    await expect(
      navigateWithRetry(page, '/', {
        attempts: 2,
        delayMs: 1,
        maxDurationMs: 20_000,
      })
    ).rejects.toThrow('after 2 attempts');

    expect(page.goto).toHaveBeenCalledTimes(2);
    expect(page.waitForTimeout).toHaveBeenCalledTimes(1);
  });

  it('suppresses retry logs after the configured log limit', async () => {
    const page = createMockPage([
      new Error('page.goto: net::ERR_CONNECTION_REFUSED'),
      new Error('page.goto: net::ERR_CONNECTION_REFUSED'),
      createTimeoutError(),
      'success',
    ]);

    await expect(
      navigateWithRetry(page, '/', {
        attempts: 4,
        delayMs: 1,
        maxLogAttempts: 1,
        maxDurationMs: 20_000,
      })
    ).resolves.toBeUndefined();

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
