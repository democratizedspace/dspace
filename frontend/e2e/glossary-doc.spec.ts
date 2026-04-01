import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Glossary doc', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('glossary page loads', async ({ page }) => {
        await page.goto('/docs/glossary');
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('heading', { name: /Glossary/i })).toBeVisible();
    });
});
