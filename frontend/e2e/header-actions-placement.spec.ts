import { expect, test, type BoundingBox } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const VIEWPORTS = [
    { label: 'desktop', viewport: { width: 1280, height: 720 } },
    { label: 'mobile', viewport: { width: 430, height: 932 } },
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

            test(
                'pins theme toggle and avatar to the top right without overlapping the brand',
                async ({ page }) => {
                    await clearUserData(page);
                    await page.goto('/');
                    await waitForHydration(page, '[data-testid="header-actions"]');

                    const actions = page.getByTestId('header-actions');
                    const brand = page.getByTestId('brand');

                    await expect(actions).toBeVisible();
                    await expect(brand).toBeVisible();

                    const actionsBox = await actions.boundingBox();
                    const brandBox = await brand.boundingBox();
                    const viewportSize = page.viewportSize();

                    expect(actionsBox).not.toBeNull();
                    expect(brandBox).not.toBeNull();
                    expect(viewportSize).not.toBeNull();

                    if (!actionsBox || !brandBox || !viewportSize) {
                        return;
                    }

                    const rightGap = viewportSize.width - (actionsBox.x + actionsBox.width);
                    const topGap = actionsBox.y;
                    const baseFontSizePx = 16;
                    const preferredGap = viewportSize.width * 0.01 + 0.25 * baseFontSizePx;

                    const rightMin = 0.75 * baseFontSizePx;
                    const rightMax = 1.5 * baseFontSizePx;
                    const expectedRightGap = Math.min(Math.max(preferredGap, rightMin), rightMax);

                    const topMin = 0.5 * baseFontSizePx;
                    const topMax = 1.25 * baseFontSizePx;
                    const expectedTopGap = Math.min(Math.max(preferredGap, topMin), topMax);

                    const tolerance = 1;

                    expect(rightGap).toBeGreaterThanOrEqual(expectedRightGap - tolerance);
                    expect(rightGap).toBeLessThanOrEqual(expectedRightGap + tolerance);
                    expect(topGap).toBeGreaterThanOrEqual(expectedTopGap - tolerance);
                    expect(topGap).toBeLessThanOrEqual(expectedTopGap + tolerance);

                    expect(boxesOverlap(actionsBox, brandBox)).toBeFalsy();

                    await page.mouse.wheel(0, 600);

                    const scrolledBox = await actions.boundingBox();
                    expect(scrolledBox).not.toBeNull();

                    if (!scrolledBox) {
                        return;
                    }

                    expect(scrolledBox.x).toBe(actionsBox.x);
                    expect(scrolledBox.y).toBe(actionsBox.y);
                }
            );
        });
    }
});
