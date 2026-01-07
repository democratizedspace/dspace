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

                const {
                    docScrollWidth,
                    docClientWidth,
                    bodyScrollWidth,
                    pageShellGapDiff,
                    maxRightEdge,
                    maxRightEdgeTag,
                } = await page.evaluate(() => {
                    const docEl = document.documentElement;
                    const shell = document.querySelector('.page-shell');
                    let pageShellGapDiff = null;

                    if (shell) {
                        const rect = shell.getBoundingClientRect();
                        const leftGap = rect.left;
                        const rightGap = docEl.clientWidth - rect.right;
                        pageShellGapDiff = Math.abs(leftGap - rightGap);
                    }

                    const elements = Array.from(document.body.querySelectorAll('*'));
                    let maxRightEdge = 0;
                    let maxRightEdgeTag = '';

                    for (const el of elements) {
                        const style = window.getComputedStyle(el);
                        if (
                            style.display === 'none' ||
                            style.visibility === 'hidden' ||
                            style.position === 'fixed'
                        ) {
                            continue;
                        }

                        if (el.tagName.toLowerCase() === 'canvas') {
                            continue;
                        }

                        const rect = el.getBoundingClientRect();
                        if (rect.width === 0 && rect.height === 0) {
                            continue;
                        }

                        if (rect.right > maxRightEdge) {
                            maxRightEdge = rect.right;
                            maxRightEdgeTag = el.tagName.toLowerCase();
                        }
                    }

                    return {
                        docScrollWidth: docEl.scrollWidth,
                        docClientWidth: docEl.clientWidth,
                        bodyScrollWidth: document.body.scrollWidth,
                        pageShellGapDiff,
                        maxRightEdge,
                        maxRightEdgeTag,
                    };
                });

                expect(docScrollWidth).toBeLessThanOrEqual(
                    docClientWidth + OVERFLOW_TOLERANCE
                );
                expect(bodyScrollWidth).toBeLessThanOrEqual(
                    docClientWidth + OVERFLOW_TOLERANCE
                );
                expect(pageShellGapDiff).not.toBeNull();
                expect(pageShellGapDiff).toBeLessThanOrEqual(1);
                expect(maxRightEdge, `widest element: ${maxRightEdgeTag}`).toBeLessThanOrEqual(
                    docClientWidth + OVERFLOW_TOLERANCE
                );
            });
        }
    }
});
