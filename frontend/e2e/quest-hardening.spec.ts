import { test, expect } from '@playwright/test';
import { navigateWithRetry, waitForHydration } from './test-helpers';

test.describe('Quest hardening rendering', () => {
    test('shows hardening metadata on quest detail page', async ({ page }) => {
        await navigateWithRetry(page, '/quests/energy/dWatt-1e3');
        await waitForHydration(page, '[data-testid="quest-hardening"]');

        const hardening = page.getByTestId('quest-hardening');
        await expect(hardening).toBeVisible();
        await expect(hardening).toContainText('Score');
        await expect(hardening).toContainText('🛠️');
    });
});
