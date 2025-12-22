import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { navigateWithRetry, waitForHydration } from './test-helpers';

type Theme = 'light' | 'dark';

async function setTheme(page: Page, theme: Theme) {
    const html = page.locator('html');
    const body = page.locator('body');
    const toggle = page.getByRole('button', { name: /toggle dark mode/i });

    await waitForHydration(page);
    await expect(toggle).toHaveAttribute('data-hydrated', 'true');

    const currentTheme = (await html.getAttribute('data-theme')) === 'light' ? 'light' : 'dark';

    if (currentTheme !== theme) {
        await toggle.click();
    }

    await expect(html).toHaveAttribute('data-theme', theme);
    await expect(body).toHaveAttribute('data-theme', theme);
}

test.describe('Changelog container regression', () => {
    const themes: Theme[] = ['light', 'dark'];

    for (const theme of themes) {
        test(`renders changelog cards and anchors in ${theme} mode`, async ({ page }) => {
            await navigateWithRetry(page, '/changelog');
            await page.waitForLoadState('networkidle');
            await setTheme(page, theme);

            const sections = page.locator('.changelog-entry');
            const cards = page.locator('.changelog-card');
            const bodies = page.locator('.changelog-card .entry-body');

            const cardCount = await cards.count();
            expect(cardCount).toBeGreaterThan(0);
            await expect(bodies).toHaveCount(cardCount);

            const firstSection = sections.first();
            const firstCard = cards.first();
            const firstBody = bodies.first();
            const firstHeader = firstCard.locator('.entry-header h3');

            await expect(firstCard).toBeVisible();
            await expect(firstBody).toBeVisible();
            await expect(firstHeader).toBeVisible();

            const bodyText = (await firstBody.innerText()).trim();
            expect(bodyText.length).toBeGreaterThan(0);

            const sectionId = await firstSection.getAttribute('id');
            const permalink = firstSection.locator('.permalink');

            await permalink.click();

            if (sectionId) {
                await expect(page).toHaveURL(new RegExp(`#${sectionId}$`));
            }

            const headerBox = await firstHeader.boundingBox();
            expect(headerBox?.y ?? -1).toBeGreaterThanOrEqual(0);

            const cardBackground = await firstCard.evaluate(
                (node) => getComputedStyle(node).backgroundColor
            );
            expect(cardBackground).not.toBe('rgba(0, 0, 0, 0)');
        });
    }
});
