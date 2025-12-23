import { test, expect } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

test.describe('Quest hardening display', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('renders hardening metadata on quest detail pages', async ({ page }) => {
        await page.goto('/quests/astronomy/iss-flyover');
        await waitForHydration(page);

        const hardening = page.getByTestId('quest-hardening');
        await expect(hardening).toBeVisible();
        await expect(hardening).toContainText('Score');
        await expect(hardening).toContainText('passes');
    });
});
