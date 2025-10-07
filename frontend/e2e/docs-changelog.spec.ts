import { expect, test } from '@playwright/test';
import { getLatestChangelogMeta } from './utils/changelog';

const latestChangelog = getLatestChangelogMeta();

// The changelog doc should render real release notes instead of the placeholder CTA.
test.describe('docs changelog page', () => {
    test('lists recent release entries', async ({ page }) => {
        await page.goto('/docs/changelog');
        await page.waitForLoadState('domcontentloaded');

        await expect(page.getByRole('heading', { name: 'Changelog' })).toBeVisible();

        const releasesList = page.getByRole('list', { name: 'Release entries' });
        await expect(releasesList).toBeVisible();

        if (latestChangelog) {
            const nbsp = '\u00a0';
            const expectedLinkText = latestChangelog.tagline
                ? `${latestChangelog.title}${nbsp}—${nbsp}${latestChangelog.tagline}`
                : latestChangelog.title;

            const latestLink = releasesList.getByRole('link', {
                name: expectedLinkText,
            });

            await expect(latestLink).toBeVisible();
            await expect(latestLink).toHaveAttribute('href', '/changelog');

            const summaryText = latestChangelog.summary
                ? latestChangelog.summary.replace(/\s+/g, ' ').trim()
                : '';

            if (summaryText) {
                await expect(
                    releasesList.getByText(summaryText, {
                        exact: true,
                    })
                ).toBeVisible();
            }
        }

        await expect(
            page.getByRole('link', { name: 'complete changelog archive' })
        ).toHaveAttribute('href', '/changelog');
    });
});
