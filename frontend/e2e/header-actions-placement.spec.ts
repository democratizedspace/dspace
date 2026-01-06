import { expect, test, type BoundingBox } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const VIEWPORTS = [
    { label: 'small mobile', viewport: { width: 320, height: 568 } },
    { label: 'mobile', viewport: { width: 375, height: 812 } },
    { label: 'large mobile', viewport: { width: 430, height: 932 } },
    { label: 'tablet', viewport: { width: 768, height: 1024 } },
    { label: 'tablet landscape', viewport: { width: 1024, height: 768 } },
    { label: 'desktop', viewport: { width: 1440, height: 900 } },
] as const;

// Allow a small cushion so subpixel font/rendering differences across platforms
// do not fail the test while still catching meaningful misalignment.
const VERTICAL_ALIGNMENT_TOLERANCE_PX = 12;
const ROW_GROUPING_TOLERANCE_PX = 2;
const NAV_WIDTH_TOLERANCE_PX = 2;

function cssLengthToPx(length: string | null, rootFontSize: number): number | null {
    if (!length) {
        return null;
    }

    const value = length.trim();

    if (!value) {
        return null;
    }

    if (value.endsWith('rem')) {
        return parseFloat(value) * rootFontSize;
    }

    if (value.endsWith('px')) {
        return parseFloat(value);
    }

    const numeric = parseFloat(value);

    return Number.isFinite(numeric) ? numeric : null;
}

function getNavInlinePaddingPx(viewportWidth: number, rootFontSize: number): number {
    const minPadding = 0.75 * rootFontSize; // clamp min
    const maxPadding = 1.25 * rootFontSize; // clamp max
    const idealPadding = viewportWidth * 0.04; // clamp middle (4vw)

    return Math.min(maxPadding, Math.max(minPadding, idealPadding));
}

function boxesOverlap(first: BoundingBox, second: BoundingBox): boolean {
    return !(
        first.x + first.width <= second.x ||
        second.x + second.width <= first.x ||
        first.y + first.height <= second.y ||
        second.y + second.height <= first.y
    );
}

test.describe('Header actions placement', () => {
    for (const { label, viewport } of VIEWPORTS) {
        test.describe(label, () => {
            test.use({ viewport });

            test('keeps brand and nav centered with non-sticky actions in the top right', async ({
                page,
            }) => {
                await clearUserData(page);
                await page.goto('/');
                await waitForHydration(page, '[data-testid="header-actions"]');

                const header = page.locator('header.header');
                const actions = page.getByTestId('header-actions');
                const actionsStack = page.getByTestId('header-actions-stack');
                const brand = page.getByTestId('brand');
                const nav = page.getByTestId('header-nav');
                const themeToggle = page.getByRole('button', { name: /dark mode|light mode/i });
                const avatarLink = page.getByTestId('header-avatar-link');

                await Promise.all([
                    expect(actions).toBeVisible(),
                    expect(actionsStack).toBeVisible(),
                    expect(brand).toBeVisible(),
                    expect(nav).toBeVisible(),
                    expect(themeToggle).toBeVisible(),
                    expect(avatarLink).toBeVisible(),
                ]);

                const [headerBox, actionsBox, brandBox, navBox, viewportSize] = await Promise.all([
                    header.boundingBox(),
                    actionsStack.boundingBox(),
                    brand.boundingBox(),
                    nav.boundingBox(),
                    page.viewportSize(),
                ]);

                expect(headerBox).not.toBeNull();
                expect(actionsBox).not.toBeNull();
                expect(brandBox).not.toBeNull();
                expect(navBox).not.toBeNull();
                expect(viewportSize).not.toBeNull();

                if (!headerBox || !actionsBox || !brandBox || !navBox || !viewportSize) {
                    return;
                }

                const headerCenter = headerBox.x + headerBox.width / 2;
                const brandCenter = brandBox.x + brandBox.width / 2;
                const navCenter = navBox.x + navBox.width / 2;

                expect(Math.abs(brandCenter - headerCenter)).toBeLessThan(8);
                // Navigation pills can wrap differently across platforms and safe-area insets,
                // so allow a slightly larger tolerance than the brand check.
                expect(Math.abs(navCenter - headerCenter)).toBeLessThanOrEqual(16);

                const rightGap = viewportSize.width - (actionsBox.x + actionsBox.width);
                const topGap = actionsBox.y;
                // Allow a small negative gap to account for subpixel rounding and safe-area
                // padding differences across platforms while still requiring the actions to
                // stay visually within the viewport.
                expect(rightGap).toBeGreaterThanOrEqual(-16);
                expect(rightGap).toBeLessThanOrEqual(32);
                expect(topGap).toBeGreaterThanOrEqual(0);
                expect(topGap).toBeLessThanOrEqual(32);

                const topAlignDelta = Math.abs(brandBox.y - actionsBox.y);
                expect(topAlignDelta).toBeLessThanOrEqual(VERTICAL_ALIGNMENT_TOLERANCE_PX);

                expect(boxesOverlap(actionsBox, brandBox)).toBeFalsy();
                expect(boxesOverlap(actionsBox, navBox)).toBeFalsy();

                const scrollDistance = Math.max(viewportSize.height * 1.5, 800);
                await page.mouse.wheel(0, scrollDistance);
                await page.evaluate(() =>
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })
                );
                await page.waitForTimeout(100);

                const scrolledBox = await actionsStack.boundingBox();
                const viewport = page.viewportSize();
                expect(viewport).not.toBeNull();

                if (scrolledBox && viewport) {
                    const inViewport =
                        scrolledBox.x + scrolledBox.width > 0 &&
                        scrolledBox.y + scrolledBox.height > 0 &&
                        scrolledBox.x < viewport.width &&
                        scrolledBox.y < viewport.height;

                    expect(inViewport).toBeFalsy();
                }
            });
        });
    }

    const MOBILE_VIEWPORT_MAX_WIDTH = 768;
    const MOBILE_VIEWPORTS = VIEWPORTS.filter(
        ({ viewport }) => viewport.width <= MOBILE_VIEWPORT_MAX_WIDTH
    );

    for (const { label, viewport } of MOBILE_VIEWPORTS) {
        test.describe(`${label} nav layout`, () => {
            test.use({ viewport });

            test('expands nav and wraps links on constrained widths', async ({ page }) => {
                await clearUserData(page);
                await page.goto('/');
                await waitForHydration(page, '[data-testid="header-actions"]');

                const nav = page.getByTestId('header-nav');
                await expect(nav).toBeVisible();

                const [navBox, viewportSize, cssMetrics] = await Promise.all([
                    nav.boundingBox(),
                    page.viewportSize(),
                    page.evaluate(() =>
                        (function gatherCssMetrics() {
                            const rootStyle = getComputedStyle(document.documentElement);

                            return {
                                rootFontSizePx: parseFloat(rootStyle.fontSize || '16'),
                                pageInlinePaddingValue: rootStyle.getPropertyValue(
                                    '--page-inline-padding'
                                ),
                            };
                        })()
                    ),
                ]);

                expect(navBox).not.toBeNull();
                expect(viewportSize).not.toBeNull();
                expect(cssMetrics?.rootFontSizePx).toBeTruthy();

                if (!navBox || !viewportSize || !cssMetrics?.rootFontSizePx) {
                    return;
                }

                const { rootFontSizePx, pageInlinePaddingValue } = cssMetrics;
                const pageInlinePaddingPx =
                    cssLengthToPx(pageInlinePaddingValue, rootFontSizePx) ?? rootFontSizePx;
                const navInlinePadding = getNavInlinePaddingPx(
                    viewportSize.width,
                    rootFontSizePx
                );
                const minNavWidth =
                    viewportSize.width - (pageInlinePaddingPx + navInlinePadding) * 2;
                expect(navBox.width + NAV_WIDTH_TOLERANCE_PX).toBeGreaterThanOrEqual(
                    minNavWidth
                );

                const navLinks = nav.locator('a:visible');
                const navLinkCount = await navLinks.count();
                expect(navLinkCount).toBeGreaterThanOrEqual(2);

                const maxLinksToCheck = Math.min(navLinkCount, 8);
                const navLinkBoxes: BoundingBox[] = [];

                for (let index = 0; index < maxLinksToCheck; index += 1) {
                    const linkBox = await navLinks.nth(index).boundingBox();
                    if (linkBox) {
                        navLinkBoxes.push(linkBox);
                    }
                }

                expect(navLinkBoxes.length).toBeGreaterThanOrEqual(2);

                const rows: { y: number; count: number }[] = [];

                for (const box of navLinkBoxes) {
                    const rowIndex = rows.findIndex(
                        (row) => Math.abs(row.y - box.y) <= ROW_GROUPING_TOLERANCE_PX
                    );

                    if (rowIndex === -1) {
                        rows.push({ y: box.y, count: 1 });
                    } else {
                        rows[rowIndex].count += 1;
                    }
                }

                const rowCount = rows.length;
                const maxRowCount = Math.max(...rows.map((row) => row.count));

                expect(rowCount).toBeGreaterThanOrEqual(2);
                expect(maxRowCount).toBeGreaterThanOrEqual(2);
            });
        });
    }
});
