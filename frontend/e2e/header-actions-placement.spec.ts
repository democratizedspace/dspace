import { expect, test, type BoundingBox } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const VIEWPORTS = [
    { label: 'small mobile', viewport: { width: 320, height: 568 } },
    { label: 'mobile', viewport: { width: 375, height: 812 } },
    { label: 'large mobile', viewport: { width: 430, height: 932 } },
    { label: 'tablet', viewport: { width: 768, height: 1024 } },
    { label: 'small laptop', viewport: { width: 1024, height: 768 } },
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

function centerOf(box: BoundingBox): number {
    return box.x + box.width / 2;
}

test.describe('Header actions placement', () => {
    for (const { label, viewport } of VIEWPORTS) {
        test.describe(label, () => {
            test.use({ viewport });

            test('keeps brand and nav centered with non-sticky actions in the header', async ({
                page,
            }) => {
                await clearUserData(page);
                await page.goto('/');
                await waitForHydration(page, '[data-testid="header-actions"]');

                const header = page.locator('header.header');
                const actionsStack = page.getByTestId('header-actions-stack');
                const brand = page.getByTestId('brand');
                const nav = page.getByTestId('header-nav');
                const themeToggle = page.getByRole('button', { name: /dark mode|light mode/i });
                const avatarLink = page.getByTestId('header-avatar-link');

                await expect(header).toBeVisible();
                await expect(actionsStack).toBeVisible();
                await expect(brand).toBeVisible();
                await expect(nav).toBeVisible();
                await expect(themeToggle).toBeVisible();
                await expect(avatarLink).toBeVisible();

                const [headerBox, brandBox, navBox, actionsBox] = await Promise.all([
                    header.boundingBox(),
                    brand.boundingBox(),
                    nav.boundingBox(),
                    actionsStack.boundingBox(),
                ]);
                const viewportSize = page.viewportSize();

                expect(headerBox).not.toBeNull();
                expect(brandBox).not.toBeNull();
                expect(navBox).not.toBeNull();
                expect(actionsBox).not.toBeNull();
                expect(viewportSize).not.toBeNull();

                if (!headerBox || !brandBox || !navBox || !actionsBox || !viewportSize) {
                    return;
                }

                const headerCenter = centerOf(headerBox);
                const brandCenter = centerOf(brandBox);
                const navCenter = centerOf(navBox);
                const rightGap = viewportSize.width - (actionsBox.x + actionsBox.width);
                const topGap = actionsBox.y - headerBox.y;

                expect(Math.abs(brandCenter - headerCenter)).toBeLessThan(8);
                expect(Math.abs(navCenter - headerCenter)).toBeLessThan(12);

                expect(rightGap).toBeGreaterThanOrEqual(0);
                expect(rightGap).toBeLessThanOrEqual(32);
                expect(topGap).toBeGreaterThanOrEqual(0);
                expect(topGap).toBeLessThanOrEqual(32);

                expect(boxesOverlap(actionsBox, brandBox)).toBeFalsy();
                expect(boxesOverlap(actionsBox, navBox)).toBeFalsy();

                await page.mouse.wheel(0, 900);

                const scrolledBox = await actionsStack.boundingBox();
                const scrolledViewport = page.viewportSize();

                expect(scrolledViewport).not.toBeNull();

                if (!scrolledViewport) {
                    return;
                }

                if (!scrolledBox) {
                    expect(scrolledBox).toBeNull();
                    return;
                }

                const inViewport =
                    scrolledBox.x + scrolledBox.width > 0 &&
                    scrolledBox.y + scrolledBox.height > 0 &&
                    scrolledBox.x < scrolledViewport.width &&
                    scrolledBox.y < scrolledViewport.height;

                expect(inViewport).toBeFalsy();
            });
        });
    }
});
