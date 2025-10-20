import type { Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import { navigateWithRetry } from '../frontend/e2e/test-helpers';

function createMockPage(failures: number): Page {
    let callCount = 0;
    const goto = vi.fn(async () => {
        callCount += 1;
        if (callCount <= failures) {
            throw new Error('net::ERR_CONNECTION_REFUSED');
        }
    });

    const waitForTimeout = vi.fn().mockResolvedValue(undefined);

    return {
        goto,
        waitForTimeout,
    } as unknown as Page;
}

describe('navigateWithRetry', () => {
    it('handles multiple connection refusals before succeeding with default retries', async () => {
        const page = createMockPage(7);

        await expect(navigateWithRetry(page, 'http://127.0.0.1:3000')).resolves.toBeUndefined();

        expect(page.goto).toHaveBeenCalledTimes(8);
        expect(page.waitForTimeout).toHaveBeenCalled();
    });

    it('propagates the last error after exhausting retries', async () => {
        const page = createMockPage(Number.POSITIVE_INFINITY);

        await expect(
            navigateWithRetry(page, 'http://127.0.0.1:3000', { attempts: 2, delayMs: 1 })
        ).rejects.toThrow('net::ERR_CONNECTION_REFUSED');

        expect(page.goto).toHaveBeenCalledTimes(2);
    });
});
