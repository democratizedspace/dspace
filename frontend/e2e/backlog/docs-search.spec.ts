import { test } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Docs search', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('placeholder for docs search', async ({ page }) => {
        await page.goto('/docs');
        // TODO: implement docs search steps
    });
});
