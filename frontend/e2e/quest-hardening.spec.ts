import { expect, test } from '@playwright/test';
import { waitForHydration } from './test-helpers';

test.describe('quest hardening metadata', () => {
    test('renders hardening details on quest page', async ({ page }) => {
        await page.goto('/quests/astronomy/meteor-shower');
        await waitForHydration(page);

        await expect(page.getByTestId('quest-hardening-status')).toContainText('Score');
        await expect(page.getByTestId('quest-hardening-passes')).toContainText('Passes');
    });
});
