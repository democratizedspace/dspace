import { expect, test } from '@playwright/test';
import { waitForHydration } from './test-helpers';

test.describe('quest hardening metadata', () => {
    test('is not surfaced on quest page', async ({ page }) => {
        await page.goto('/quests/astronomy/meteor-shower');
        await waitForHydration(page);

        await expect(page.getByText('Hardening:', { exact: false })).toHaveCount(0);
        await expect(page.getByText(/Passes:/i)).toHaveCount(0);
        await expect(page.getByText(/Score .*\\/100/i)).toHaveCount(0);
    });
});
