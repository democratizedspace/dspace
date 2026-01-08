import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const MOBILE_VIEWPORTS = [
    { width: 320, height: 568 },
    { width: 375, height: 812 },
];

const MOBILE_PATHS = ['/', '/quests', '/changelog', '/cloudsync', '/leaderboard'];
const OVERFLOW_TOLERANCE = 1;
const PADDING_TOLERANCE = 1;

test.describe('Mobile page overflow regression', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    for (const viewport of MOBILE_VIEWPORTS) {
        for (const path of MOBILE_PATHS) {
            test(`keeps ${path} within viewport at ${viewport.width}x${viewport.height}`, async ({
                page,
            }) => {
                await page.setViewportSize(viewport);

                await page.goto(path);
                await page.waitForLoadState('networkidle');
                await waitForHydration(page);

                const metrics = await page.evaluate(() => {
                    const docEl = document.documentElement;
                    const main = document.querySelector('main#main');
                    const computed = main ? window.getComputedStyle(main) : null;

                    return {
                        docScrollWidth: docEl.scrollWidth,
                        docClientWidth: docEl.clientWidth,
                        bodyScrollWidth: document.body.scrollWidth,
                        paddingLeft: computed ? parseFloat(computed.paddingLeft) : null,
                        paddingRight: computed ? parseFloat(computed.paddingRight) : null,
                    };
                });

                expect(metrics.docScrollWidth).toBeLessThanOrEqual(
                    metrics.docClientWidth + OVERFLOW_TOLERANCE
                );
                expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(
                    metrics.docClientWidth + OVERFLOW_TOLERANCE
                );
                expect(metrics.paddingLeft).not.toBeNull();
                expect(metrics.paddingRight).not.toBeNull();
                expect(
                    Math.abs(
                        (metrics.paddingLeft ?? 0) - (metrics.paddingRight ?? 0)
                    )
                ).toBeLessThanOrEqual(PADDING_TOLERANCE);
            });
        }
    }
});
