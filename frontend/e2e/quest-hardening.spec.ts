import { test, expect } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

test.describe('quest hardening display', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('shows hardening metadata on quest detail page', async ({ page }) => {
        await page.goto('/quests/electronics/arduino-blink');
        await waitForHydration(page);

        const badge = page.getByTestId('hardening-badge');
        await expect(badge).toBeVisible();
        await expect(badge).toContainText('Score:');
    });
});
