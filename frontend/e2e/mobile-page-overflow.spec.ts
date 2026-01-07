import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const MOBILE_VIEWPORTS = [
    { width: 320, height: 568 },
    { width: 375, height: 812 },
];

const OVERFLOW_TOLERANCE = 2;

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
                    viewportWidth,
                } = await page.evaluate(() => {
                    const docEl = document.documentElement;
                    const main = document.querySelector('main#main');
                    const pageShell = document.querySelector('.page-shell');
                    const viewportWidth = docEl.clientWidth;
                    let pageShellGapDiff = null;

                    if (pageShell) {
                        const rect = pageShell.getBoundingClientRect();
                        const leftGap = rect.left;
                        const rightGap = viewportWidth - rect.right;
                        pageShellGapDiff = Math.abs(leftGap - rightGap);
                    } else if (main) {
                        const rect = main.getBoundingClientRect();
                        const leftGap = rect.left;
                        const rightGap = viewportWidth - rect.right;
                        pageShellGapDiff = Math.abs(leftGap - rightGap);
                    }

                    const root = pageShell || main || document.body;
                    const elements = [root, ...Array.from(root.querySelectorAll('*'))];
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
                        viewportWidth,
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
                expect(pageShellGapDiff).toBeLessThanOrEqual(OVERFLOW_TOLERANCE);
                expect(
                    maxRightEdge,
                    `widest element: ${maxRightEdgeTag}`
                ).toBeLessThanOrEqual(viewportWidth + OVERFLOW_TOLERANCE);
            });
        }
    }
});
