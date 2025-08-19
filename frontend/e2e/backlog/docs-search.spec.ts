import { test } from '@playwright/test';

test.describe.skip('Docs search', () => {
    test('returns results for a query', async ({ page }) => {
        await page.goto('/docs');
        // TODO: implement search once feature is stable
    });
});
