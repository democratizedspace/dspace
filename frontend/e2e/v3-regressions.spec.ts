import { expect, test } from '@playwright/test';

type Viewport = { name: string; width: number; height: number };

const viewports: Viewport[] = [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'mobile', width: 480, height: 820 },
];

const persistenceRoutes = ['/quests', '/wallet', '/profile', '/stats'];

const themeLabel = (theme: string) => (theme === 'dark' ? 'Dark mode' : 'Light mode');

viewports.forEach((viewport) => {
    test(`header alignment and toggle placement (${viewport.name})`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');

        const header = page.locator('header.header');
        const brand = page.getByTestId('brand');
        const toggle = page.getByTestId('theme-toggle');

        await expect(brand).toBeVisible();
        await expect(toggle).toBeVisible();

        const headerBox = await header.boundingBox();
        const brandBox = await brand.boundingBox();
        const toggleBox = await toggle.boundingBox();

        expect(headerBox && brandBox && toggleBox).toBeTruthy();
        if (!headerBox || !brandBox || !toggleBox) return;

        const headerCenter = headerBox.x + headerBox.width / 2;
        const brandCenter = brandBox.x + brandBox.width / 2;
        const allowedOffset = viewport.name === 'desktop' ? 12 : 24;

        expect(Math.abs(headerCenter - brandCenter)).toBeLessThanOrEqual(allowedOffset);
        expect(toggleBox.x).toBeGreaterThan(brandBox.x);
        expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(headerBox.x + headerBox.width);
    });
});

test('wallet page renders balances and actions', async ({ page }) => {
    await page.goto('/wallet');

    await expect(page.getByRole('heading', { name: 'Wallet' })).toBeVisible();
    await expect(page.getByTestId('wallet-balance').first()).toBeVisible();

    const actionCards = page.locator('.card-grid .link-card');
    await expect(actionCards.first()).toBeVisible();

    const cardText = (await actionCards.first().textContent())?.trim() || '';
    expect(cardText.length).toBeGreaterThan(0);
});

test('theme preference persists across pages', async ({ page }) => {
    await page.goto('about:blank');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/');
    const toggle = page.getByTestId('theme-toggle');

    const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    await toggle.click();

    const expectedTheme = initialTheme === 'dark' ? 'light' : 'dark';
    await expect(page.locator('html')).toHaveAttribute('data-theme', expectedTheme);
    await expect(page.locator('body')).toHaveAttribute('data-theme', expectedTheme);
    await expect(toggle).toContainText(themeLabel(expectedTheme));

    for (const route of persistenceRoutes) {
        await page.goto(route);
        await expect(page.locator('html')).toHaveAttribute('data-theme', expectedTheme);
        await expect(page.locator('body')).toHaveAttribute('data-theme', expectedTheme);
        await expect(page.getByTestId('theme-toggle')).toContainText(themeLabel(expectedTheme));
    }
});

test('flywheel navigation is removed', async ({ page, request }) => {
    await page.goto('/');
    expect(await page.getByRole('link', { name: 'Flywheel' }).count()).toBe(0);
    expect(await page.getByRole('button', { name: 'Flywheel' }).count()).toBe(0);

    const response = await request.get('/flywheel');
    expect(response.status()).toBeGreaterThanOrEqual(400);
});
