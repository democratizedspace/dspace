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

function isInViewport(box: BoundingBox, viewport: { width: number; height: number }): boolean {
    return (
        box.x + box.width > 0 &&
        box.y + box.height > 0 &&
        box.x < viewport.width &&
        box.y < viewport.height
    );
}

function centerOf(box: BoundingBox): number {
    return box.x + box.width / 2;
}

test.describe('Header actions placement', () => {
    for (const { label, viewport } of VIEWPORTS) {
        test.describe(label, () => {
            test.use({ viewport });

            test('keeps header centered with actions in the top right without sticking', async ({
                page,
            }) => {
                await clearUserData(page);
                await page.goto('/');
                await waitForHydration(page, '[data-testid="header-actions"]');
                await waitForHydration(page, '[data-testid="header-nav"]');

                const header = page.locator('header.header');
                const actions = page.getByTestId('header-actions');
                const actionsStack = page.getByTestId('header-actions-stack');
                const brand = page.getByTestId('brand');
                const nav = page.getByTestId('header-nav');
                const themeToggle = page.getByRole('button', { name: /dark mode|light mode/i });
                const avatarLink = page.getByTestId('header-avatar-link');

                await expect(actions).toBeVisible();
                await expect(actionsStack).toBeVisible();
                await expect(brand).toBeVisible();
                await expect(nav).toBeVisible();
                await expect(themeToggle).toBeVisible();
                await expect(avatarLink).toBeVisible();

                const headerBox = await header.boundingBox();
                const actionsBox = await actionsStack.boundingBox();
                const brandBox = await brand.boundingBox();
                const navBox = await nav.boundingBox();
                const viewportSize = page.viewportSize();

                expect(headerBox).not.toBeNull();
                expect(actionsBox).not.toBeNull();
                expect(brandBox).not.toBeNull();
                expect(navBox).not.toBeNull();
                expect(viewportSize).not.toBeNull();

                if (!headerBox || !actionsBox || !brandBox || !navBox || !viewportSize) {
                    return;
                }

                const headerCenter = centerOf(headerBox);
                const brandCenter = centerOf(brandBox);
                const navCenter = centerOf(navBox);
                expect(Math.abs(brandCenter - headerCenter)).toBeLessThan(8);
                expect(Math.abs(navCenter - headerCenter)).toBeLessThan(12);

                const rightGap = viewportSize.width - (actionsBox.x + actionsBox.width);
                const topGap = actionsBox.y;
                expect(rightGap).toBeGreaterThanOrEqual(0);
                expect(rightGap).toBeLessThanOrEqual(32);
                expect(topGap).toBeGreaterThanOrEqual(0);
                expect(topGap).toBeLessThanOrEqual(32);

                expect(boxesOverlap(actionsBox, brandBox)).toBeFalsy();
                expect(boxesOverlap(actionsBox, navBox)).toBeFalsy();

                await page.mouse.wheel(0, 900);

                const scrolledBox = await actionsStack.boundingBox();
                expect(scrolledBox).not.toBeNull();

                if (!scrolledBox) {
                    return;
                }

                const visibleAfterScroll = isInViewport(scrolledBox, viewportSize);
                expect(visibleAfterScroll).toBeFalsy();
            });
        });
    }
});
