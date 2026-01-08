import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const VIEWPORTS = [
    { width: 320, height: 568 },
    { width: 375, height: 812 },
];

const PATHS = ['/', '/quests', '/changelog', '/cloudsync', '/leaderboard'];
const OVERFLOW_TOLERANCE = 1;
const PADDING_TOLERANCE = 1;

test.describe('Mobile page overflow regression', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    for (const viewport of VIEWPORTS) {
        for (const path of PATHS) {
            const testName = [
                'keeps',
                path,
                'within viewport at',
                `${viewport.width}x${viewport.height}`,
            ].join(' ');

            test(testName, async ({ page }) => {
                await page.setViewportSize(viewport);

                await page.goto(path);
                await page.waitForLoadState('networkidle');
                await waitForHydration(page);

                const {
                    docScrollWidth,
                    docClientWidth,
                    bodyScrollWidth,
                    paddingLeft,
                    paddingRight,
                } = await page.evaluate(() => {
                    const docEl = document.documentElement;
                    const main = document.querySelector('main#main');
                    const styles = main ? getComputedStyle(main) : null;

                    return {
                        docScrollWidth: docEl.scrollWidth,
                        docClientWidth: docEl.clientWidth,
                        bodyScrollWidth: document.body.scrollWidth,
                        paddingLeft: styles ? parseFloat(styles.paddingLeft) : 0,
                        paddingRight: styles ? parseFloat(styles.paddingRight) : 0,
                    };
                });

                expect(docScrollWidth).toBeLessThanOrEqual(docClientWidth + OVERFLOW_TOLERANCE);
                expect(bodyScrollWidth).toBeLessThanOrEqual(docClientWidth + OVERFLOW_TOLERANCE);
                expect(Math.abs(paddingLeft - paddingRight)).toBeLessThanOrEqual(PADDING_TOLERANCE);
            });
        }
    }
});
