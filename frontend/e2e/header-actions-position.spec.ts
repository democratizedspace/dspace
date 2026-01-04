import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const viewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 430, height: 932 },
];

test.describe('Header actions positioning', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    for (const viewport of viewports) {
        test(`pins header actions at ${viewport.width}x${viewport.height}`, async ({ page }) => {
            await page.setViewportSize(viewport);
            await page.goto('/');
            await waitForHydration(page);

            const actions = page.getByTestId('header-actions');
            const brand = page.getByTestId('brand');

            await expect(actions).toBeVisible();
            await expect(brand).toBeVisible();

            const viewportSize = page.viewportSize();
            expect(viewportSize).not.toBeNull();

            const initialActionsBox = await actions.boundingBox();
            const brandBox = await brand.boundingBox();

            expect(initialActionsBox).not.toBeNull();
            expect(brandBox).not.toBeNull();

            const actionsBox = initialActionsBox!;
            const gapToRight = viewportSize!.width - (actionsBox.x + actionsBox.width);

            expect(gapToRight).toBeLessThanOrEqual(16);
            expect(actionsBox.y).toBeGreaterThanOrEqual(6);

            await page.evaluate(() => window.scrollTo(0, 400));

            const scrolledActionsBox = await actions.boundingBox();
            expect(scrolledActionsBox).not.toBeNull();

            expect(Math.abs(scrolledActionsBox!.y - actionsBox.y)).toBeLessThanOrEqual(2);
            expect(Math.abs(scrolledActionsBox!.x - actionsBox.x)).toBeLessThanOrEqual(2);

            const overlapsHorizontally = brandBox!.x + brandBox!.width > actionsBox.x;
            const overlapsVertically =
                brandBox!.y + brandBox!.height > actionsBox.y &&
                actionsBox.y + actionsBox.height > brandBox!.y;

            expect(overlapsHorizontally && overlapsVertically).toBeFalsy();
        });
    }
});
