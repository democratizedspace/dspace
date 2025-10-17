import { test, expect } from '@playwright/test';
import { clearUserData, gotoAndWaitForHydration } from './test-helpers';

const pinnedNavLinks = ['Home', 'Quests', 'Inventory', 'Docs'];

test.describe('Page Layout Structure', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('home page surfaces brand header and primary navigation', async ({ page }) => {
        const navToggle = page.getByRole('button', { name: 'Toggle additional menu items' });
        await gotoAndWaitForHydration(page, '/', { hydrationTarget: navToggle });

        const main = page.getByRole('main');
        await expect(main).toBeVisible();

        await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeVisible();

        const brandLink = page.getByRole('link', { name: 'Go to homepage' });
        await expect(brandLink).toBeVisible();
        await expect(
            brandLink.getByRole('img', { name: 'Minimal rocket launching from Mars' })
        ).toBeVisible();

        const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
        await expect(navigation).toBeVisible();

        for (const label of pinnedNavLinks) {
            await expect(navigation.getByRole('link', { name: label, exact: true })).toBeVisible();
        }

        await expect(navigation.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute(
            'aria-current',
            'page'
        );

        await expect(page.getByRole('button', { name: 'Toggle dark mode' })).toBeVisible();
    });

    test('quests page exposes action shortcuts and quest cards', async ({ page }) => {
        const navToggle = page.getByRole('button', { name: 'Toggle additional menu items' });
        await gotoAndWaitForHydration(page, '/quests', { hydrationTarget: navToggle });

        const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
        await expect(navigation.getByRole('link', { name: 'Quests', exact: true })).toHaveAttribute(
            'aria-current',
            'page'
        );

        await expect(page.getByRole('heading', { level: 2, name: 'Quests' })).toBeVisible();
        await expect(
            page.getByRole('link', { name: 'Create a new quest', exact: true })
        ).toBeVisible();
        await expect(page.getByRole('link', { name: 'Managed quests', exact: true })).toBeVisible();

        await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible();
    });

    test('inventory page surfaces search tools and items', async ({ page }) => {
        const navToggle = page.getByRole('button', { name: 'Toggle additional menu items' });
        await gotoAndWaitForHydration(page, '/inventory', { hydrationTarget: navToggle });

        const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
        await expect(
            navigation.getByRole('link', { name: 'Inventory', exact: true })
        ).toHaveAttribute('aria-current', 'page');

        await expect(page.getByRole('heading', { level: 2, name: 'Inventory' })).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'Show all items' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Search items' })).toBeVisible();

        await expect(page.getByRole('link', { name: /Count:/ }).first()).toBeVisible();
    });

    test('primary navigation remains visible across breakpoints', async ({ page }) => {
        const viewports = [
            { width: 375, height: 667 },
            { width: 768, height: 1024 },
            { width: 1366, height: 768 },
        ];

        for (const viewport of viewports) {
            await page.setViewportSize(viewport);
            const navToggle = page.getByRole('button', { name: 'Toggle additional menu items' });
            await gotoAndWaitForHydration(page, '/', { hydrationTarget: navToggle });

            const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
            await expect(navigation).toBeVisible();
            await expect(
                navigation.getByRole('link', { name: 'Home', exact: true })
            ).toHaveAttribute('aria-current', 'page');
        }
    });
});
