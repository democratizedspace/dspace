import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const MOBILE_VIEWPORTS = [
    { width: 320, height: 568 },
    { width: 375, height: 812 },
];

const TARGET_PATHS = ['/', '/quests', '/changelog', '/cloudsync', '/leaderboard'];

const OVERFLOW_TOLERANCE = 1;
const PADDING_TOLERANCE = 1;

test.describe('Mobile page overflow regression', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    for (const viewport of MOBILE_VIEWPORTS) {
        for (const path of TARGET_PATHS) {
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
                const docDirection = await page.evaluate(
                    () => getComputedStyle(document.documentElement).direction
                );

                const main = page.locator('main#main');
                await expect(main).toBeVisible();

                const { paddingLeft, paddingRight } = await main.evaluate((element) => {
                    const style = window.getComputedStyle(element);
                    return {
                        paddingLeft: Number.parseFloat(style.paddingLeft || '0'),
                        paddingRight: Number.parseFloat(style.paddingRight || '0'),
                    };
                });

                expect(docClientWidth).toBeGreaterThan(0);
                expect(docDirection).toBe('ltr');
                try {
                    expect(docScrollWidth).toBeLessThanOrEqual(docClientWidth + OVERFLOW_TOLERANCE);
                    expect(bodyScrollWidth).toBeLessThanOrEqual(
                        docClientWidth + OVERFLOW_TOLERANCE
                    );
                } catch (error) {
                    if (path === '/changelog') {
                        console.info('Changelog overflow diagnostics', {
                            docScrollWidth,
                            docClientWidth,
                            bodyScrollWidth,
                            paddingLeft,
                            paddingRight,
                        });
                    }
                    throw error;
                }
                expect(Math.abs(paddingLeft - paddingRight)).toBeLessThanOrEqual(PADDING_TOLERANCE);
            });
        }
    }
});
