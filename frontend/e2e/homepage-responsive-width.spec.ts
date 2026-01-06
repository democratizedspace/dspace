import { expect, test } from '@playwright/test';

const mobileViewports = [
    { width: 320, height: 568 },
    { width: 375, height: 812 },
    { width: 430, height: 932 },
];

test.describe('homepage responsiveness', () => {
    for (const viewport of mobileViewports) {
        test(`does not overflow horizontally at ${viewport.width}x${viewport.height}`, async ({
            page,
        }) => {
            await page.setViewportSize(viewport);
            await page.goto('/');

            const { scrollWidth, clientWidth } = await page.evaluate(() => ({
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
            }));

            expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
        });
    }
});

test.describe('quests page width', () => {
    test('keeps quests grid wide on desktop', async ({ page }) => {
        const viewportWidth = 1440;
        await page.setViewportSize({ width: viewportWidth, height: 900 });
        await page.goto('/quests');

        const questsGrid = page.getByTestId('quests-grid');
        await expect(questsGrid).toBeVisible();

        const box = await questsGrid.boundingBox();
        const width = box?.width ?? 0;

        expect(width).toBeGreaterThanOrEqual(viewportWidth - 2 * 64);
    });
});
