import { expect, test } from '@playwright/test';
import { clearUserData } from './test-helpers';
import { getChangelogEntries } from './utils/changelog';

const changelogEntries = getChangelogEntries();

test.describe('changelog landing page', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('renders the changelog archive with newest entries first', async ({ page }) => {
        await page.goto('/changelog');
        await page.waitForLoadState('domcontentloaded');

        const entryHeadings = page.getByRole('heading', { level: 3 });
        await expect(entryHeadings.first()).toBeVisible();

        if (changelogEntries.length > 0) {
            const expectedTitles = changelogEntries.map((entry) => entry.title);
            await expect(entryHeadings).toHaveText(expectedTitles);
        }

        if (changelogEntries.length > 0) {
            const latestEntry = changelogEntries[0];
            await expect(page.getByText(latestEntry.title, { exact: true })).toBeVisible();
        }
    });
});
