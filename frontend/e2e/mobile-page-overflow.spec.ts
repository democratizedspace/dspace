import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const MOBILE_VIEWPORT = { width: 375, height: 812 };
const OVERFLOW_TOLERANCE = 1;
const MARGIN_TOLERANCE = 2;

const ROUTES = [
    { path: '/', label: 'home' },
    { path: '/quests', label: 'quests' },
    { path: '/changelog', label: 'changelog' },
    { path: '/cloudsync', label: 'cloud sync' },
    { path: '/leaderboard', label: 'leaderboard' },
];

test.describe('Mobile page bounds regression', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    for (const route of ROUTES) {
        test(`keeps ${route.label} content within the viewport`, async ({ page }) => {
            await page.setViewportSize(MOBILE_VIEWPORT);

            await page.goto(route.path);
            await page.waitForLoadState('networkidle');
            await waitForHydration(page);

            const { docScrollWidth, docClientWidth, bodyScrollWidth } = await page.evaluate(() => {
                const docEl = document.documentElement;
                return {
                    docScrollWidth: docEl.scrollWidth,
                    docClientWidth: docEl.clientWidth,
                    bodyScrollWidth: document.body.scrollWidth,
                };
            });

            expect(docScrollWidth).toBeLessThanOrEqual(docClientWidth + OVERFLOW_TOLERANCE);
            expect(bodyScrollWidth).toBeLessThanOrEqual(docClientWidth + OVERFLOW_TOLERANCE);

            const margins = await page.evaluate(() => {
                const shell = document.querySelector('[data-page-shell]');
                if (!shell) {
                    return null;
                }

                const rect = shell.getBoundingClientRect();
                const viewportWidth = document.documentElement.clientWidth;
                return {
                    left: rect.left,
                    right: viewportWidth - rect.right,
                };
            });

            expect(margins).not.toBeNull();
            if (margins) {
                expect(margins.left).toBeGreaterThanOrEqual(0);
                expect(margins.right).toBeGreaterThanOrEqual(0);
                expect(Math.abs(margins.left - margins.right)).toBeLessThanOrEqual(
                    MARGIN_TOLERANCE
                );
            }
        });
    }
});
