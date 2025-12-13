import { test, expect, type Page } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Grant items option rendering', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('displays granted item list for tutorial quest', async ({ page }) => {
        await page.goto('/quests/welcome/howtodoquests');
        await page.waitForLoadState('networkidle');

        const chatPanel = page.locator('[data-testid="chat-panel"]');
        await expect(chatPanel).toBeVisible({ timeout: 15000 });

        await clickOption(page, 'A quest, you say? Tell me more.');
        await clickOption(page, 'Alright, lay it on me, dChat.');
        await clickOption(page, "What's next?");

        await expect(
            page.getByText('Some dialogue options grant items', { exact: false })
        ).toBeVisible();

        const grantOption = page.locator('.options').filter({
            hasText: 'Great, free stuff! Thanks!',
        });
        await expect(grantOption).toBeVisible();

        await expect(grantOption.getByText('dCarbon')).toBeVisible();
        await expect(grantOption.getByText('dUSD')).toBeVisible();
        await expect(grantOption.getByText('10')).toBeVisible();
        await expect(grantOption.getByText('100')).toBeVisible();
    });
});

async function clickOption(page: Page, text: string) {
    const option = page.getByText(text, { exact: true });
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
}
