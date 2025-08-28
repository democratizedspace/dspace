import { test } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Dark mode toggle', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('placeholder for dark mode toggle', async ({ page }) => {
        await page.goto('/');
        // TODO: implement dark mode toggle steps
    });
});
