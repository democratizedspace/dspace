import { test, expect } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

test.describe('Custom content backup', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test.afterEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('renders the backup controls', async ({ page }) => {
        await page.goto('/contentbackup');
        await waitForHydration(page);
        await expect(page.getByText('Custom content backup string:')).toBeVisible();
        await expect(page.getByRole('button', { name: /Copy/i })).toBeVisible();
    });
});
