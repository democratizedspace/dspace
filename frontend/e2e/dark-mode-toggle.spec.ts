import { expect, test } from '@playwright/test';
import { clearUserData, expectLocalStorageValue, waitForHydration } from './test-helpers';

test.describe('Dark mode toggle', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('persists theme preference between sessions', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);
        const html = page.locator('html');
        const body = page.locator('body');
        const toggle = page.getByRole('button', { name: /toggle dark mode/i });

        await expect(toggle).toHaveAttribute('data-hydrated', 'true');

        const initialTheme = (await html.getAttribute('data-theme')) === 'light' ? 'light' : 'dark';
        const toggledTheme = initialTheme === 'dark' ? 'light' : 'dark';

        await expect(html).toHaveAttribute('data-theme', initialTheme);
        await expect(body).toHaveAttribute('data-theme', initialTheme);
        await expect(toggle).toHaveAttribute(
            'aria-pressed',
            initialTheme === 'dark' ? 'true' : 'false'
        );

        await toggle.click();

        await expect(html).toHaveAttribute('data-theme', toggledTheme);
        await expect(body).toHaveAttribute('data-theme', toggledTheme);
        await expect(toggle).toHaveAttribute(
            'aria-pressed',
            toggledTheme === 'dark' ? 'true' : 'false'
        );
        await expectLocalStorageValue(page, 'dspace-theme', toggledTheme);

        await page.reload();
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(html).toHaveAttribute('data-theme', toggledTheme);
        await expect(body).toHaveAttribute('data-theme', toggledTheme);
        await expect(page.getByRole('button', { name: /toggle dark mode/i })).toHaveAttribute(
            'aria-pressed',
            toggledTheme === 'dark' ? 'true' : 'false'
        );
        await expectLocalStorageValue(page, 'dspace-theme', toggledTheme);
    });

    test('keeps the chosen theme across navigation', async ({ page }) => {
        await page.goto('/');
        await waitForHydration(page);

        const html = page.locator('html');
        const body = page.locator('body');
        const toggle = page.getByRole('button', { name: /toggle dark mode/i });

        await expect(toggle).toHaveAttribute('data-hydrated', 'true');

        const initialTheme = (await html.getAttribute('data-theme')) === 'light' ? 'light' : 'dark';
        const targetTheme = initialTheme === 'dark' ? 'light' : 'dark';

        await toggle.click();

        const routes = ['/', '/quests', '/wallet', '/inventory', '/docs'];
        for (const route of routes) {
            await page.goto(route);
            await page.waitForLoadState('networkidle');
            await waitForHydration(page);

            await expect(html).toHaveAttribute('data-theme', targetTheme);
            await expect(body).toHaveAttribute('data-theme', targetTheme);

            const currentToggle = page.getByRole('button', { name: /toggle dark mode/i });
            await expect(currentToggle).toHaveAttribute('data-hydrated', 'true');
            await expect(currentToggle).toContainText(
                targetTheme === 'dark' ? /Dark mode/ : /Light mode/
            );
        }
    });

    test('toggle and avatar stay pinned to the top right without overlapping the logo', async ({
        page,
    }) => {
        const viewports = [
            { label: 'desktop', size: { width: 1280, height: 900 } },
            { label: 'mobile', size: { width: 430, height: 900 } },
        ];

        for (const { label, size } of viewports) {
            await page.setViewportSize(size);
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            await waitForHydration(page);

            const header = page.locator('header.header');
            const actions = page.getByTestId('header-actions');
            const brand = page.getByTestId('brand');
            const toggle = page.getByRole('button', { name: /toggle dark mode/i });
            const avatar = page.getByTestId('header-avatar-link');

            await expect(toggle, `${label}: toggle is visible`).toBeVisible();
            await expect(avatar, `${label}: avatar is visible`).toBeVisible();

            const [headerBox, actionsBox, brandBox, toggleBox, avatarBox] = await Promise.all([
                header.boundingBox(),
                actions.boundingBox(),
                brand.boundingBox(),
                toggle.boundingBox(),
                avatar.boundingBox(),
            ]);

            if (!headerBox || !actionsBox || !brandBox || !toggleBox || !avatarBox) {
                throw new Error(`${label}: could not measure header layout`);
            }

            const rightPadding = size.width - (actionsBox.x + actionsBox.width);
            expect(
                rightPadding,
                `${label}: actions should sit near the right edge`
            ).toBeLessThanOrEqual(16);
            expect(
                rightPadding,
                `${label}: actions should not overflow the viewport`
            ).toBeGreaterThanOrEqual(0);

            const topOffset = actionsBox.y - headerBox.y;
            expect(
                topOffset,
                `${label}: actions should align to the top of the header`
            ).toBeLessThanOrEqual(12);
            expect(
                topOffset,
                `${label}: actions should stay within the header`
            ).toBeGreaterThanOrEqual(0);

            const gapToBrand = actionsBox.x - (brandBox.x + brandBox.width);
            expect(
                gapToBrand,
                `${label}: actions should not overlap the logo`
            ).toBeGreaterThanOrEqual(8);

            const stacked = avatarBox.y >= toggleBox.y + toggleBox.height - 2;
            expect(stacked, `${label}: avatar should sit beneath the toggle`).toBe(true);
        }
    });
});
