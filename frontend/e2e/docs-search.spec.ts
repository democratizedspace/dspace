import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Docs search', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('filters docs list by query and resets on clear', async ({ page }) => {
        await page.goto('/docs');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const searchInput = page.getByRole('searchbox', { name: /search docs/i });
        await expect(searchInput).toBeVisible();

        await searchInput.fill('quest');

        await expect(
            page.getByRole('link', { name: 'Quest Development Guidelines', exact: true })
        ).toBeVisible();
        await expect(
            page.getByRole('link', { name: 'Quest Schema Requirements', exact: true })
        ).toBeVisible();
        await expect(page.getByRole('link', { name: 'Solar power', exact: true })).toHaveCount(0);

        await searchInput.fill('');
        await expect(page.getByRole('link', { name: 'Solar power', exact: true })).toBeVisible();
    });

    test('supports has: feature operators for docs content', async ({ page }) => {
        await page.goto('/docs');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const searchInput = page.getByRole('searchbox', { name: /search docs/i });
        await searchInput.fill('has:image');

        await expect(page.getByRole('link', { name: 'NPCs', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Processes', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Mission', exact: true })).toHaveCount(0);

        await searchInput.fill('has:link');

        await expect(page.getByRole('link', { name: 'About', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Mission', exact: true })).toHaveCount(0);
    });

    test('shows a body text snippet for full-text matches', async ({ page }) => {
        await page.goto('/docs');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const searchInput = page.getByRole('searchbox', { name: /search docs/i });
        await searchInput.fill('turbine');

        const solarLink = page.getByRole('link', { name: 'Solar power', exact: true });
        await expect(solarLink).toBeVisible();

        const snippet = solarLink.locator('..').locator('.doc-snippet');
        await expect(snippet).toContainText('Wind');
        await expect(snippet.locator('strong')).toHaveText(/turbines/i);

        await searchInput.fill('');
        await expect(page.locator('.doc-snippet')).toHaveCount(0);
    });

    test('wraps and clamps long snippet tokens without overflowing layout', async ({ page }) => {
        await page.goto('/docs');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const searchInput = page.getByRole('searchbox', { name: /search docs/i });
        await searchInput.fill('github');

        const docsSearchLink = page.getByRole('link', { name: 'Docs search', exact: true });
        await expect(docsSearchLink).toBeVisible();

        const snippet = docsSearchLink.locator('..').locator('.doc-snippet');
        await expect(snippet).toBeVisible();
        await expect(snippet).toHaveAttribute('title', /https:\/\/github\.com/);

        const overflowWrap = await snippet.evaluate((el) => getComputedStyle(el).overflowWrap);
        expect(['anywhere', 'break-word']).toContain(overflowWrap);

        const lineClamp = await snippet.evaluate((el) => getComputedStyle(el).webkitLineClamp);
        expect(lineClamp).toBe('2');

        const doesNotOverflow = await snippet.evaluate(
            (el) => el.scrollWidth <= el.clientWidth + 1
        );
        expect(doesNotOverflow).toBe(true);

        const docLinkBox = await docsSearchLink.locator('..').boundingBox();
        expect(docLinkBox).not.toBeNull();

        const viewportWidth =
            page.viewportSize()?.width ?? (await page.evaluate(() => window.innerWidth));

        if (docLinkBox) {
            expect(docLinkBox.x).toBeGreaterThanOrEqual(0);
            expect(docLinkBox.x + docLinkBox.width).toBeLessThanOrEqual(viewportWidth + 1);
        }
    });
});
