import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Page } from '../frontend/e2e/test-helpers';
import { navigateWithRetry } from '../frontend/e2e/test-helpers';

type GotoCall = { url: string; timeout?: number; waitUntil?: string };

function createTimeoutError(message = 'page.goto: Timeout 15000ms exceeded.') {
  const error = new Error(message);
  error.name = 'TimeoutError';
  return error;
}

function createHarness(
  outcomes: Array<'success' | Error>,
  durations: number[] = outcomes.map(() => 0)
): {
  page: Page;
  calls: GotoCall[];
  sleeps: number[];
  now: () => number;
  sleep: (ms: number) => Promise<void>;
} {
  let currentTime = 0;
  const calls: GotoCall[] = [];
  const sleeps: number[] = [];
  let index = 0;

  const page = {
    goto: vi.fn(
      async (
        url: string,
        options?: { waitUntil?: string; timeout?: number }
      ) => {
        calls.push({
          url,
          waitUntil: options?.waitUntil,
          timeout: options?.timeout,
        });
        const duration = durations[index] ?? 0;
        const outcome = outcomes[index] ?? 'success';
        index += 1;
        currentTime += duration;

        if (outcome instanceof Error) {
          throw outcome;
        }
      }
    ),
    waitForTimeout: vi.fn(async (ms: number) => {
      sleeps.push(ms);
      currentTime += ms;
    }),
  } as unknown as Page;

  return {
    page,
    calls,
    sleeps,
    now: () => currentTime,
    sleep: async (ms: number) => {
      sleeps.push(ms);
      currentTime += ms;
    },
  };
}

describe('navigateWithRetry', () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  afterEach(() => {
    consoleWarnSpy.mockClear();
  });

  it('retries a Playwright navigation timeout before succeeding', async () => {
    const harness = createHarness(
      [createTimeoutError(), 'success'],
      [15_000, 100]
    );

    await navigateWithRetry(harness.page, '/', {
      maxDurationMs: 35_000,
      delayMs: 300,
      now: harness.now,
      sleep: harness.sleep,
    });

    expect(harness.page.goto).toHaveBeenCalledTimes(2);
    expect(harness.sleeps).toEqual([300]);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(harness.calls.map((call) => call.timeout)).toEqual([35_000, 19_700]);
  });

  it('retries a connection refusal before succeeding', async () => {
    const harness = createHarness([
      new Error(
        'page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3000/'
      ),
      'success',
    ]);

    await navigateWithRetry(harness.page, '/', {
      maxDurationMs: 10_000,
      delayMs: 250,
      now: harness.now,
      sleep: harness.sleep,
    });

    expect(harness.page.goto).toHaveBeenCalledTimes(2);
    expect(harness.sleeps).toEqual([250]);
  });

  it('keeps successful first-attempt navigation unchanged except for bounded timeout', async () => {
    const harness = createHarness(['success']);

    await navigateWithRetry(harness.page, '/chat', {
      maxDurationMs: 12_000,
      now: harness.now,
    });

    expect(harness.page.goto).toHaveBeenCalledTimes(1);
    expect(harness.calls).toEqual([
      { url: '/chat', waitUntil: 'domcontentloaded', timeout: 12_000 },
    ]);
    expect(harness.sleeps).toEqual([]);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('fails non-retryable navigation errors immediately', async () => {
    const certificateError = new Error(
      'page.goto: net::ERR_CERT_AUTHORITY_INVALID'
    );
    const harness = createHarness([certificateError, 'success']);

    await expect(
      navigateWithRetry(harness.page, '/', {
        now: harness.now,
        sleep: harness.sleep,
      })
    ).rejects.toThrow(certificateError);

    expect(harness.page.goto).toHaveBeenCalledTimes(1);
    expect(harness.sleeps).toEqual([]);
  });

  it('bounds each navigation timeout by the remaining overall duration', async () => {
    const harness = createHarness(
      [new Error('page.goto: Timeout 15000ms exceeded.'), 'success'],
      [1_200, 0]
    );

    await navigateWithRetry(harness.page, '/', {
      maxDurationMs: 2_000,
      delayMs: 300,
      now: harness.now,
      sleep: harness.sleep,
    });

    expect(harness.calls.map((call) => call.timeout)).toEqual([2_000, 500]);
  });

  it('does not begin another attempt or backoff when the duration budget is exhausted', async () => {
    const harness = createHarness(
      [createTimeoutError(), 'success'],
      [1_000, 0]
    );

    await expect(
      navigateWithRetry(harness.page, '/', {
        maxDurationMs: 1_000,
        delayMs: 1,
        now: harness.now,
        sleep: harness.sleep,
      })
    ).rejects.toThrow('limit 1000ms');

    expect(harness.page.goto).toHaveBeenCalledTimes(1);
    expect(harness.sleeps).toEqual([]);
  });

  it('stops after exhausting the configured attempt count', async () => {
    const harness = createHarness([
      createTimeoutError(),
      createTimeoutError(),
      'success',
    ]);

    await expect(
      navigateWithRetry(harness.page, '/', {
        attempts: 2,
        delayMs: 1,
        maxDurationMs: 10_000,
        now: harness.now,
        sleep: harness.sleep,
      })
    ).rejects.toThrow('after 2 attempts');

    expect(harness.page.goto).toHaveBeenCalledTimes(2);
    expect(harness.sleeps).toEqual([1]);
  });

  it('suppresses retry logs after the configured maximum', async () => {
    const harness = createHarness([
      createTimeoutError(),
      createTimeoutError(),
      createTimeoutError(),
      'success',
    ]);

    await navigateWithRetry(harness.page, '/', {
      attempts: 4,
      delayMs: 1,
      maxLogAttempts: 1,
      maxDurationMs: 10_000,
      now: harness.now,
      sleep: harness.sleep,
    });

    expect(harness.page.goto).toHaveBeenCalledTimes(4);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('Retrying navigation');
    expect(consoleWarnSpy.mock.calls[1]?.[0]).toContain(
      'Suppressing further retry logs'
    );
  });
});
