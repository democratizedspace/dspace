import { test, expect } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

test.describe('GrantItems quest options', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('shows granted item list for the tutorial quest option', async ({ page }) => {
        await page.goto('/quests/welcome/howtodoquests');
        await waitForHydration(page, '[data-testid="chat-panel"]');

        const clickOption = async (name: RegExp) => {
            const option = page.getByRole('button', { name });
            await expect(option).toBeVisible();
            await option.click();
        };

        await clickOption(/A quest, you say\? Tell me more\./i);
        await clickOption(/Alright, lay it on me, dChat\./i);
        await clickOption(/What's next\?/i);

        const grantOption = page.getByRole('button', {
            name: /Great, free stuff! Thanks!/i,
        });
        await expect(grantOption).toBeVisible();

        await expect(grantOption.locator('img[alt="dCarbon"]')).toBeVisible();
        await expect(grantOption.locator('img[alt="dUSD"]')).toBeVisible();
        await expect(grantOption).toContainText('10');
        await expect(grantOption).toContainText('100');
    });
});
