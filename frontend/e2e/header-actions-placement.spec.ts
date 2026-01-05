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
                expect(Math.abs(navCenter - headerCenter)).toBeLessThan(8);

                const rightGap = viewportSize.width - (actionsBox.x + actionsBox.width);
                const topGap = actionsBox.y;
                expect(rightGap).toBeGreaterThanOrEqual(0);
                expect(rightGap).toBeLessThanOrEqual(32);
                expect(topGap).toBeGreaterThanOrEqual(0);
                expect(topGap).toBeLessThanOrEqual(32);

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
});
