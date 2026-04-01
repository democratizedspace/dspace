import { expect, test } from '@playwright/test';
import { waitForHydration } from './test-helpers';

test.describe('quest hardening metadata', () => {
    test('hides hardening details from the quest page', async ({ page }) => {
        await page.goto('/quests/astronomy/meteor-shower');
        await waitForHydration(page);

        await expect(page.getByTestId('quest-hardening-status')).toHaveCount(0);
        await expect(page.getByTestId('quest-hardening-passes')).toHaveCount(0);
    });
});
