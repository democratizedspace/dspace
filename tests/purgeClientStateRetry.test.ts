import { describe, expect, it, vi } from 'vitest';
import type { Page } from '@playwright/test';

vi.mock('/src/utils/gameState/common.js', () => ({}));

import { navigateWithRetry } from '../frontend/e2e/test-helpers';

describe('navigateWithRetry', () => {
  it('retries navigation when the preview server is not ready', async () => {
    const goto = vi
      .fn(async () => undefined as Awaited<ReturnType<Page['goto']>>)
      .mockRejectedValueOnce(
        new Error(
          'page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3000/'
        )
      )
      .mockResolvedValue(undefined as Awaited<ReturnType<Page['goto']>>);

    const waitForTimeout = vi.fn(
      async () => undefined as Awaited<ReturnType<Page['waitForTimeout']>>
    );

    await navigateWithRetry(
      {
        goto,
        waitForTimeout,
      } as unknown as Page,
      '/'
    );

    expect(goto).toHaveBeenCalledTimes(2);
    expect(waitForTimeout).toHaveBeenCalledTimes(1);
  });

  it('rethrows non retryable navigation errors', async () => {
    const navigationError = new Error(
      'page.goto: Navigation timeout of 30000ms exceeded'
    );
    const page = {
      goto: vi.fn(async () => {
        throw navigationError;
      }),
      waitForTimeout: vi.fn(async () => undefined),
    } as unknown as Page;

    await expect(navigateWithRetry(page, '/')).rejects.toThrow(navigationError);
  });
});
