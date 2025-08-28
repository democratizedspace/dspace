import { test } from '@playwright/test';

// TODO: Implement changelog doc page test

test('changelog doc loads placeholder', async ({ page }) => {
    await page.goto('/docs/changelog');
});
