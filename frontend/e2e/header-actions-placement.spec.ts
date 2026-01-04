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

                    expect(rightGap).toBeGreaterThanOrEqual(0);
                    expect(rightGap).toBeLessThanOrEqual(32);
                    expect(topGap).toBeGreaterThanOrEqual(0);
                    expect(topGap).toBeLessThanOrEqual(24);

                    expect(boxesOverlap(actionsBox, brandBox)).toBeFalsy();

                    await page.mouse.wheel(0, 600);

                    const scrolledBox = await actions.boundingBox();
                    expect(scrolledBox).not.toBeNull();

                    if (!scrolledBox) {
                        return;
                    }

                    expect(scrolledBox.x).toBeCloseTo(actionsBox.x, 1);
                    expect(scrolledBox.y).toBeCloseTo(actionsBox.y, 1);
                }
            );
        });
    }
});
