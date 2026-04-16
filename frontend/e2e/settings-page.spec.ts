import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Settings route', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('loads settings page', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        await expect(page.getByRole('heading', { level: 2, name: 'Settings' })).toBeVisible();
        await expect(
            page.getByRole('heading', { level: 2, name: 'Manage your DSPACE session' })
        ).toBeVisible();
        await expect(page.getByRole('heading', { level: 3, name: 'Log out' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
        await expect(page.getByTestId('logout-state')).toHaveText('No saved credentials detected.');
    });

    test('keeps settings layout contract across desktop and mobile viewports', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const desktopLayout = await page.evaluate(() => {
            const settingsContent = document.querySelector('.settings-content');
            const legacyUpgrade = document.querySelector('.legacy-upgrade');
            const cards = ['.logout-panel', '.panel', '.data-reset']
                .map((selector) => document.querySelector(selector))
                .filter((element): element is Element => element !== null);

            if (!settingsContent || !legacyUpgrade || cards.length < 3) {
                return null;
            }

            const toRoundedTop = (element: Element): number =>
                Math.round(element.getBoundingClientRect().top);

            const uniqueCardRows = new Set(cards.map(toRoundedTop));
            const settingsRect = settingsContent.getBoundingClientRect();
            const legacyRect = legacyUpgrade.getBoundingClientRect();
            const gridColumns = getComputedStyle(settingsContent)
                .gridTemplateColumns.split(' ')
                .filter(Boolean);

            return {
                rowCount: uniqueCardRows.size,
                cardCount: cards.length,
                gridColumnCount: gridColumns.length,
                legacyGridColumn: getComputedStyle(legacyUpgrade).gridColumn,
                settingsWidth: settingsRect.width,
                legacyWidth: legacyRect.width,
            };
        });

        expect(desktopLayout).not.toBeNull();
        expect(desktopLayout?.gridColumnCount).toBeGreaterThan(1);
        expect(desktopLayout?.rowCount).toBeLessThan(desktopLayout?.cardCount ?? 0);
        expect(desktopLayout?.legacyGridColumn).toContain('1 / -1');
        expect(desktopLayout?.legacyWidth ?? 0).toBeGreaterThanOrEqual(
            (desktopLayout?.settingsWidth ?? 0) - 2
        );

        await page.setViewportSize({ width: 390, height: 844 });
        await page.reload();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const mobileLayout = await page.evaluate(() => {
            const settingsContent = document.querySelector('.settings-content');
            const cards = ['.logout-panel', '.panel', '.data-reset']
                .map((selector) => document.querySelector(selector))
                .filter((element): element is Element => element !== null);

            if (!settingsContent || cards.length < 3) {
                return null;
            }

            const uniqueCardRows = new Set(
                cards.map((element) => Math.round(element.getBoundingClientRect().top))
            );

            const gridColumns = getComputedStyle(settingsContent)
                .gridTemplateColumns.split(' ')
                .filter(Boolean);

            return {
                rowCount: uniqueCardRows.size,
                cardCount: cards.length,
                gridColumnCount: gridColumns.length,
            };
        });

        expect(mobileLayout).not.toBeNull();
        expect(mobileLayout?.gridColumnCount).toBe(1);
        expect(mobileLayout?.rowCount).toBe(mobileLayout?.cardCount);
    });
});
