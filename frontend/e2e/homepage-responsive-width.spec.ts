import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const MOBILE_VIEWPORTS = [
    { width: 320, height: 568 },
    { width: 375, height: 812 },
    { width: 430, height: 932 },
];

const OVERFLOW_TOLERANCE = 1;
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const DESKTOP_MARGIN_ALLOWANCE = 64 * 2;

test.describe('Responsive width regression tests', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    for (const viewport of MOBILE_VIEWPORTS) {
        test(`should not overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
            await page.setViewportSize(viewport);

            await page.goto('/');
            await page.waitForLoadState('networkidle');
            await waitForHydration(page);

            const { scrollWidth, clientWidth } = await page.evaluate(() => {
                const docEl = document.documentElement;
                return {
                    scrollWidth: docEl.scrollWidth,
                    clientWidth: docEl.clientWidth,
                };
            });

            expect(scrollWidth).toBeLessThanOrEqual(clientWidth + OVERFLOW_TOLERANCE);
        });
    }

    test('quests grid stays wide on desktop', async ({ page }) => {
        await page.setViewportSize(DESKTOP_VIEWPORT);

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const firstQuest = page.getByTestId('quest-tile').first();
        await expect(firstQuest).toBeVisible();

        const questsGrid = page.getByTestId('quests-grid');
        await expect(questsGrid).toBeVisible();

        const { gridWidth, viewportWidth } = await questsGrid.evaluate((el) => {
            const rect = el.getBoundingClientRect();
            return {
                gridWidth: rect.width,
                viewportWidth: document.documentElement.clientWidth,
            };
        });

        expect(gridWidth).toBeGreaterThanOrEqual(viewportWidth - DESKTOP_MARGIN_ALLOWANCE);
    });
});
