import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Docs search', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('filters docs list by query and resets on clear', async ({ page }) => {
        await page.goto('/docs');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const searchInput = page.getByRole('textbox', { name: /search docs/i });
        await expect(searchInput).toBeVisible();

        await searchInput.fill('quest');

        await expect(
            page.getByRole('link', { name: 'Quest Development Guidelines', exact: true })
        ).toBeVisible();
        await expect(
            page.getByRole('link', { name: 'Quest Schema Requirements', exact: true })
        ).toBeVisible();
        await expect(page.getByRole('link', { name: 'About', exact: true })).toHaveCount(0);

        await searchInput.fill('');
        await expect(page.getByRole('link', { name: 'About', exact: true })).toBeVisible();
    });
});
