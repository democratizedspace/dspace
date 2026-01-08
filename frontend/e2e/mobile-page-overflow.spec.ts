import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const MOBILE_VIEWPORTS = [
    { width: 320, height: 568 },
    { width: 375, height: 812 },
];

const PATHS = ['/', '/quests', '/changelog', '/cloudsync', '/leaderboard'];

const OVERFLOW_TOLERANCE = 1;
const PADDING_TOLERANCE = 1;

test.describe('Mobile page overflow regression tests', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    for (const viewport of MOBILE_VIEWPORTS) {
        for (const path of PATHS) {
            test(`keeps ${path} within viewport at ${viewport.width}x${viewport.height}`, async ({
                page,
            }) => {
                await page.setViewportSize(viewport);

                await page.goto(path);
                await page.waitForLoadState('networkidle');
                await waitForHydration(page);

                const { docScrollWidth, docClientWidth, bodyScrollWidth } = await page.evaluate(
                    () => {
                        const docEl = document.documentElement;
                        return {
                            docScrollWidth: docEl.scrollWidth,
                            docClientWidth: docEl.clientWidth,
                            bodyScrollWidth: document.body.scrollWidth,
                        };
                    }
                );

                expect(docScrollWidth).toBeLessThanOrEqual(docClientWidth + OVERFLOW_TOLERANCE);
                expect(bodyScrollWidth).toBeLessThanOrEqual(docClientWidth + OVERFLOW_TOLERANCE);

                const main = page.getByRole('main');
                await expect(main).toBeVisible();

                const { paddingLeft, paddingRight } = await main.evaluate((el) => {
                    const style = window.getComputedStyle(el);
                    return {
                        paddingLeft: Number.parseFloat(style.paddingLeft),
                        paddingRight: Number.parseFloat(style.paddingRight),
                    };
                });

                expect(Math.abs(paddingLeft - paddingRight)).toBeLessThanOrEqual(PADDING_TOLERANCE);
            });
        }
    }
});
