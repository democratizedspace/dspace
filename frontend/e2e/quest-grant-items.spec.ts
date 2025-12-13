import { expect, test } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

const tutorialGrantItems = [{ name: 'dCarbon' }, { name: 'dUSD' }];

test.describe('Tutorial quest grant items', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('shows grant and requirement item lists for the how-to quest', async ({ page }) => {
        await page.goto('/quests/welcome/howtodoquests');
        await waitForHydration(page, '[data-testid="chat-panel"]');

        await page.getByRole('button', { name: /A quest, you say\? Tell me more\./i }).click();
        await page.getByRole('button', { name: /Alright, lay it on me, dChat\./i }).click();
        await page.getByRole('button', { name: /What's next\?/i }).click();

        const grantOption = page.getByRole('button', { name: /Great, free stuff! Thanks!/i });
        await expect(grantOption).toBeVisible();

        for (const { name } of tutorialGrantItems) {
            await expect(
                grantOption.getByRole('img', { name: new RegExp(name, 'i') })
            ).toBeVisible();
            await expect(grantOption.getByText(new RegExp(name, 'i'))).toBeVisible();
        }

        const requiresOption = page.getByRole('button', { name: /Like this, right\?/i });
        await expect(requiresOption).toBeVisible();
        await expect(requiresOption.getByRole('img', { name: /dCarbon/i })).toBeVisible();
        await expect(requiresOption.getByText(/dCarbon/i)).toBeVisible();
    });
});
