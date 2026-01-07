import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const MOBILE_VIEWPORT = { width: 375, height: 812 };
const OVERFLOW_TOLERANCE = 1;

const PAGES = [
    { path: '/', label: 'home' },
    { path: '/quests', label: 'quests' },
    { path: '/changelog', label: 'changelog' },
    { path: '/cloudsync', label: 'cloud sync' },
    { path: '/leaderboard', label: 'leaderboard' },
];

test.describe('Mobile content width boundaries', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
        await page.setViewportSize(MOBILE_VIEWPORT);
    });

    for (const pageInfo of PAGES) {
        test(`keeps ${pageInfo.label} content within the viewport`, async ({ page }) => {
            await page.goto(pageInfo.path);
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
        });
    }
});
