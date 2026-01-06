import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const MOBILE_VIEWPORTS = [
    { width: 320, height: 568 },
    { width: 375, height: 812 },
];

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const OVERFLOW_TOLERANCE = 1;
const QUESTS_EDGE_PADDING = 64;

test.describe('Homepage responsive widths', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    for (const viewport of MOBILE_VIEWPORTS) {
        test(`does not overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
            await page.setViewportSize(viewport);
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            await waitForHydration(page);

            const { docScrollWidth, docClientWidth, bodyScrollWidth } = await page.evaluate(() => {
                const doc = document.documentElement;
                return {
                    docScrollWidth: doc.scrollWidth,
                    docClientWidth: doc.clientWidth,
                    bodyScrollWidth: document.body.scrollWidth,
                };
            });

            expect(docScrollWidth).toBeLessThanOrEqual(docClientWidth + OVERFLOW_TOLERANCE);
            expect(bodyScrollWidth).toBeLessThanOrEqual(docClientWidth + OVERFLOW_TOLERANCE);
        });
    }
});

test.describe('Desktop quest layout remains wide', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('quests grid spans the viewport at desktop widths', async ({ page }) => {
        await page.setViewportSize(DESKTOP_VIEWPORT);
        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const questsGrid = page.getByTestId('quests-grid');
        await expect(questsGrid).toBeVisible();

        const { width } = await questsGrid.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return { width: rect.width };
        });

        const expectedMinimum = DESKTOP_VIEWPORT.width - QUESTS_EDGE_PADDING * 2;
        expect(width).toBeGreaterThanOrEqual(expectedMinimum);
    });
});
