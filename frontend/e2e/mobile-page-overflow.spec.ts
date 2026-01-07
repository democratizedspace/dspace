import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const MOBILE_VIEWPORTS = [
    { width: 320, height: 568 },
    { width: 375, height: 812 },
];

const OVERFLOW_TOLERANCE = 1;

const PAGES = [
    { label: 'home', path: '/' },
    { label: 'quests', path: '/quests' },
    { label: 'changelog', path: '/changelog' },
    { label: 'cloud sync', path: '/cloudsync' },
    { label: 'leaderboard', path: '/leaderboard' },
];

test.describe('Mobile page width bounds', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    for (const viewport of MOBILE_VIEWPORTS) {
        for (const { label, path } of PAGES) {
            test(`keeps ${label} within viewport at ${viewport.width}x${viewport.height}`, async ({
                page,
            }) => {
                await page.setViewportSize(viewport);
                await page.goto(path);
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

                expect(docScrollWidth).toBeLessThanOrEqual(
                    docClientWidth + OVERFLOW_TOLERANCE
                );
                expect(bodyScrollWidth).toBeLessThanOrEqual(
                    docClientWidth + OVERFLOW_TOLERANCE
                );
            });
        }
    }
});
