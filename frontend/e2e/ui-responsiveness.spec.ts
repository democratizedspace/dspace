import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('UI Responsiveness Metrics', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('home page shows hydration metric', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-testid="hydration-time"]');
        const text = await page.textContent('[data-testid="hydration-time"]');
        expect(text).toMatch(/Hydration time: \d+ ms/);
    });
});
