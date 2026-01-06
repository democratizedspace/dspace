import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORTS = [
    { width: 320, height: 568 },
    { width: 375, height: 812 },
];

test.describe('Homepage responsive width', () => {
    for (const viewport of MOBILE_VIEWPORTS) {
        test(`does not overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
            await page.setViewportSize(viewport);
            await page.goto('/');
            await page.waitForLoadState('networkidle');

            const { scrollWidth, clientWidth } = await page.evaluate(() => {
                const doc = document.documentElement;
                return {
                    scrollWidth: doc.scrollWidth,
                    clientWidth: doc.clientWidth,
                };
            });

            expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
        });
    }
});

test.describe('Quests layout width', () => {
    test('keeps quests grid wide on desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/quests');
        await page.waitForLoadState('networkidle');

        const grid = page.getByTestId('quests-grid');
        await expect(grid).toBeVisible();

        const { gridWidth, viewportWidth } = await grid.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return {
                gridWidth: rect.width,
                viewportWidth: document.documentElement.clientWidth,
            };
        });

        expect(gridWidth).toBeGreaterThanOrEqual(viewportWidth - 128);
    });
});
