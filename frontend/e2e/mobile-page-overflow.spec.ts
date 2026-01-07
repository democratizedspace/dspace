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
                    bodyScrollWidth,
                    pageShellGapDiff,
                    maxRightEdge,
                    maxRightEdgeTag,
                    effectiveViewportWidth,
                } = await page.evaluate(() => {
                    const docEl = document.documentElement;
                    const main = document.querySelector('main#main');
                    const pageShell = document.querySelector('.page-shell');
                    const visualViewportWidth = window.visualViewport?.width;
                    const viewportWidth = visualViewportWidth || docEl.clientWidth || window.innerWidth;
                    const docClientWidth = docEl.clientWidth || viewportWidth;
                    const innerWidth = window.innerWidth || viewportWidth;
                    const effectiveViewportWidth = Math.max(viewportWidth, docClientWidth, innerWidth);
                    let pageShellGapDiff = null;

                    if (main) {
                        const style = window.getComputedStyle(main);
                        const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
                        const paddingRight = Number.parseFloat(style.paddingRight) || 0;
                        pageShellGapDiff = Math.abs(paddingLeft - paddingRight);
                    } else if (pageShell) {
                        const rect = pageShell.getBoundingClientRect();
                        const leftGap = rect.left;
                        const rightGap = viewportWidth - rect.right;
                        pageShellGapDiff = Math.abs(leftGap - rightGap);
                    }

                    const root = pageShell || main || document.body;
                    const elements = [root, ...Array.from(root.querySelectorAll('*'))];
                    let maxRightEdge = 0;
                    let maxRightEdgeTag = '';

                    const isScrollableX = (element) => {
                        const style = window.getComputedStyle(element);
                        const overflowX = style.overflowX;
                        if (overflowX !== 'auto' && overflowX !== 'scroll') {
                            return false;
                        }

                        return element.scrollWidth > element.clientWidth + 1;
                    };

                    const hasScrollableAncestor = (element) => {
                        let parent = element.parentElement;
                        while (parent && parent !== root) {
                            if (isScrollableX(parent)) {
                                return true;
                            }
                            parent = parent.parentElement;
                        }
                        return false;
                    };

                    for (const el of elements) {
                        const style = window.getComputedStyle(el);
                        if (style.display === 'none' || style.visibility === 'hidden') {
                            continue;
                        }

                        if (!['static', 'relative'].includes(style.position)) {
                            continue;
                        }

                        if (el.tagName.toLowerCase() === 'canvas') {
                            continue;
                        }

                        if (el !== root && hasScrollableAncestor(el)) {
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
                        bodyScrollWidth: document.body.scrollWidth,
                        pageShellGapDiff,
                        effectiveViewportWidth,
                        maxRightEdge,
                        maxRightEdgeTag,
                    };
                });

                expect(docScrollWidth).toBeLessThanOrEqual(
                    effectiveViewportWidth + OVERFLOW_TOLERANCE
                );
                expect(bodyScrollWidth).toBeLessThanOrEqual(
                    effectiveViewportWidth + OVERFLOW_TOLERANCE
                );
                expect(pageShellGapDiff).not.toBeNull();
                expect(pageShellGapDiff).toBeLessThanOrEqual(OVERFLOW_TOLERANCE);
                expect(
                    maxRightEdge,
                    `widest element: ${maxRightEdgeTag}`
                ).toBeLessThanOrEqual(effectiveViewportWidth + OVERFLOW_TOLERANCE);
            });
        }
    }
});
