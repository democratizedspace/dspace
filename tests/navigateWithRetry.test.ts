// @vitest-environment node

import { readFileSync } from 'node:fs';
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

  it('retries an opted-in stable Playwright navigation abort before succeeding', async () => {
    const page = createMockPage([
      new Error(
        'page.goto: net::ERR_ABORTED at https://democratized.space/chat'
      ),
      'success',
    ]);

    await expect(
      navigateWithRetry(page, '/chat', {
        attempts: 2,
        delayMs: 1,
        maxDurationMs: 20_000,
        retryAbortedNavigation: true,
      })
    ).resolves.toBeUndefined();

    expect(page.goto).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Retrying navigation to /chat after aborted navigation (attempt 1 of 2)'
    );
  });

  it('retries multiple opted-in navigation aborts within the configured bounds', async () => {
    const abort = () =>
      new Error(
        'page.goto: net::ERR_ABORTED at https://democratized.space/chat\nCall log:\n  - navigating to "https://democratized.space/chat"'
      );
    const page = createMockPage([abort(), abort(), 'success']);

    await expect(
      navigateWithRetry(page, '/chat', {
        attempts: 3,
        delayMs: 1,
        maxDurationMs: 20_000,
        retryAbortedNavigation: true,
      })
    ).resolves.toBeUndefined();

    expect(page.goto).toHaveBeenCalledTimes(3);
    expect(page.waitForTimeout).toHaveBeenCalledTimes(2);
  });

  it('preserves the original abort diagnostic when opted-in attempts are exhausted', async () => {
    const diagnostic =
      'page.goto: net::ERR_ABORTED at https://democratized.space/chat\nCall log:\n  - navigating to "https://democratized.space/chat"';
    const page = createMockPage([
      new Error(diagnostic),
      new Error(diagnostic),
      'success',
    ]);

    await expect(
      navigateWithRetry(page, '/chat', {
        attempts: 2,
        delayMs: 1,
        maxDurationMs: 20_000,
        retryAbortedNavigation: true,
      })
    ).rejects.toThrow(
      `${diagnostic} while navigating to /chat after 2 attempts`
    );

    expect(page.goto).toHaveBeenCalledTimes(2);
  });

  it('stops opted-in abort retries when the total-duration budget is exhausted', async () => {
    let nowMs = 0;
    const diagnostic =
      'page.goto: net::ERR_ABORTED at https://democratized.space/chat';
    const page = createMockPage([new Error(diagnostic), 'success']);
    page.goto.mockImplementationOnce(async () => {
      nowMs = 950;
      throw new Error(diagnostic);
    });

    await expect(
      navigateWithRetry(page, '/chat', {
        attempts: 3,
        delayMs: 100,
        maxDurationMs: 1_000,
        retryAbortedNavigation: true,
        now: () => nowMs,
      })
    ).rejects.toThrow(
      `${diagnostic} while navigating to /chat after 950ms (limit 1000ms)`
    );

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });

  it('does not retry a navigation abort without explicit opt-in', async () => {
    const page = createMockPage([
      new Error(
        'page.goto: net::ERR_ABORTED at https://democratized.space/chat'
      ),
      'success',
    ]);

    await expect(navigateWithRetry(page, '/chat')).rejects.toThrow(
      'after 1 attempt'
    );

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });

  it.each([
    'page.goto: net::ERR_ABORTED for https://democratized.space/chat',
    'page.goto: net::ERR_ABORTED at democratized.space/chat',
    'locator.click: net::ERR_ABORTED at https://democratized.space/chat',
    'page.goto: net::ERR_ABORTED_BY_CLIENT at https://democratized.space/chat',
  ])('does not retry near-match abort text: %s', async (message) => {
    const page = createMockPage([new Error(message), 'success']);

    await expect(
      navigateWithRetry(page, '/chat', {
        attempts: 2,
        retryAbortedNavigation: true,
      })
    ).rejects.toThrow('after 1 attempt');

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });

  it.each([
    'routing/configuration: /chat origin drift',
    'hydration: chat panel did not hydrate',
    'assertion: expected chat panel',
  ])('fails closed for non-navigation smoke failure: %s', async (message) => {
    const page = createMockPage([new Error(message), 'success']);

    await expect(
      navigateWithRetry(page, '/chat', {
        attempts: 2,
        retryAbortedNavigation: true,
      })
    ).rejects.toThrow(message);

    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(page.waitForTimeout).not.toHaveBeenCalled();
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

describe('remote chat smoke navigation contract', () => {
  it('uses bounded opted-in navigation for chat and identity before validating results', () => {
    const source = readFileSync(
      new URL('../frontend/e2e/remote-chat-smoke.spec.ts', import.meta.url),
      'utf8'
    );
    const openExpectedPanelStart = source.indexOf(
      'async function openExpectedPanel'
    );
    const selectOpenAIBoundary = source.indexOf(
      'async function selectOpenAI',
      openExpectedPanelStart
    );

    expect(openExpectedPanelStart).toBeGreaterThanOrEqual(0);
    expect(selectOpenAIBoundary).toBeGreaterThan(openExpectedPanelStart);

    const openExpectedPanel = source.slice(
      openExpectedPanelStart,
      selectOpenAIBoundary
    );

    expect(openExpectedPanel).toContain(
      "await navigateWithRetry(page, '/chat', { retryAbortedNavigation: true });"
    );
    expect(openExpectedPanel).not.toContain("page.goto('/chat')");

    const originCheck = openExpectedPanel.indexOf('new URL(page.url()).origin');
    const hydrationCheck = openExpectedPanel.indexOf(
      'await waitForHydration(page)'
    );
    expect(originCheck).toBeGreaterThan(-1);
    expect(hydrationCheck).toBeGreaterThan(originCheck);

    const identityStart = source.indexOf(
      "test('identity: approved build identity matches JSON and HTML'"
    );
    const journeyBoundary = source.indexOf('journeyTest(', identityStart);
    expect(identityStart).toBeGreaterThanOrEqual(0);
    expect(journeyBoundary).toBeGreaterThan(identityStart);

    const identityJourney = source.slice(identityStart, journeyBoundary);
    expect(identityJourney).toContain(
      "await navigateWithRetry(page, '/chat', { retryAbortedNavigation: true });"
    );
    expect(identityJourney).not.toContain("page.goto('/chat')");

    const identityNavigation = identityJourney.indexOf(
      "await navigateWithRetry(page, '/chat', { retryAbortedNavigation: true });"
    );
    const identityOriginCheck = identityJourney.indexOf(
      'new URL(page.url()).origin'
    );
    const htmlAgreementCheck = identityJourney.indexOf(
      'page.locator(\'meta[name="dspace-build-revision"]\')'
    );
    expect(identityNavigation).toBeGreaterThan(-1);
    expect(identityOriginCheck).toBeGreaterThan(identityNavigation);
    expect(htmlAgreementCheck).toBeGreaterThan(identityOriginCheck);
  });

  it('uses bounded opted-in navigation before checking the identity test final origin', () => {
    const source = readFileSync(
      new URL('../frontend/e2e/remote-chat-smoke.spec.ts', import.meta.url),
      'utf8'
    );
    const identityTestStart = source.indexOf(
      "test('identity: approved build identity matches JSON and HTML'"
    );
    const journeyTestBoundary = source.indexOf(
      'journeyTest(',
      identityTestStart
    );

    expect(identityTestStart).toBeGreaterThanOrEqual(0);
    expect(journeyTestBoundary).toBeGreaterThan(identityTestStart);

    const identityTest = source.slice(identityTestStart, journeyTestBoundary);
    const boundedNavigation =
      /await\s+navigateWithRetry\(\s*page\s*,\s*['"]\/chat['"]\s*,\s*\{\s*retryAbortedNavigation\s*:\s*true\s*\}\s*\)\s*;/.exec(
        identityTest
      );
    const directNavigation = /page\s*\.\s*goto\(\s*['"]\/chat['"]\s*\)/.exec(
      identityTest
    );
    const originCheck =
      /new\s+URL\(\s*page\s*\.\s*url\(\s*\)\s*\)\s*\.\s*origin/.exec(
        identityTest
      );

    expect(boundedNavigation).not.toBeNull();
    expect(directNavigation).toBeNull();
    expect(originCheck).not.toBeNull();
    expect(originCheck?.index ?? -1).toBeGreaterThan(
      boundedNavigation?.index ?? -1
    );
  });
});
