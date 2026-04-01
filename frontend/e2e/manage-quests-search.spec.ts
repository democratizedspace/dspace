import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const manageQuestsHydrationSelector = '.manage-quests[data-hydrated="true"]';

test.describe('Manage Quests Search', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('filters quests by search term', async ({ page }) => {
        const unique = Date.now();
        const titles = [`Search Quest A ${unique}`, `Search Quest B ${unique}`];
        const questDescription =
            'A descriptive quest summary that satisfies the minimum length requirements.';

        for (const title of titles) {
            await page.goto('/quests/create');
            await page.waitForLoadState('networkidle');
            await waitForHydration(page);

            await page.fill('#title', title);
            await page.fill('#description', questDescription);

            const submit = page.getByRole('button', { name: 'Create Quest' });
            await expect(submit).toBeEnabled();
            await Promise.all([page.waitForLoadState('networkidle'), submit.click()]);
            await expect(page.getByRole('status')).toContainText('Quest created successfully');
        }

        await page.goto('/quests/manage');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, manageQuestsHydrationSelector);

        await expect(page.getByRole('heading', { name: 'Manage Quests' })).toBeVisible();

        const search = page.getByPlaceholder('Search quests...');
        await search.fill(titles[1]);

        const quests = page.getByTestId('quest-row');
        await expect(quests).toHaveCount(1);
        await expect(quests.first()).toContainText(titles[1]);

        await search.fill('NoMatch');
        await expect(page.locator('.no-quests')).toBeVisible();
    });
});
