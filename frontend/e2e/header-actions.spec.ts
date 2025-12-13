import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const DEFAULT_AVATAR = '/assets/pfp/7ecc9e2a-dd79-4bf8-87b5-57f090dd8c14.jpg';

test.describe('Header actions', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('keeps logo centered and stacks actions on desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const brand = page.getByTestId('brand');
        const brandBox = await brand.boundingBox();
        if (!brandBox) {
            throw new Error('Brand logo not found');
        }

        const viewport = page.viewportSize();
        if (!viewport) {
            throw new Error('Viewport size unavailable');
        }

        const brandCenter = Math.round(brandBox.x + brandBox.width / 2);
        const viewportCenter = Math.round(viewport.width / 2);

        expect(brandCenter).toBe(viewportCenter);

        const toggleBox = await page.getByRole('button', { name: /dark mode/i }).boundingBox();
        const avatarLocator = page.getByTestId('header-avatar-image');
        const avatarBox = await avatarLocator.boundingBox();

        if (!toggleBox || !avatarBox) {
            throw new Error('Header actions did not render');
        }

        expect(toggleBox.y + toggleBox.height).toBeLessThanOrEqual(avatarBox.y);
        await expect(avatarLocator).toHaveAttribute('src', DEFAULT_AVATAR);
    });

    test('keeps logo centered and stacks actions on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 430, height: 932 });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const brand = page.getByTestId('brand');
        const brandBox = await brand.boundingBox();
        if (!brandBox) {
            throw new Error('Brand logo not found');
        }

        const viewport = page.viewportSize();
        if (!viewport) {
            throw new Error('Viewport size unavailable');
        }

        const brandCenter = Math.round(brandBox.x + brandBox.width / 2);
        const viewportCenter = Math.round(viewport.width / 2);

        expect(brandCenter).toBe(viewportCenter);

        const toggleBox = await page.getByRole('button', { name: /dark mode/i }).boundingBox();
        const avatarBox = await page.getByTestId('header-avatar-image').boundingBox();

        if (!toggleBox || !avatarBox) {
            throw new Error('Header actions did not render');
        }

        expect(toggleBox.y + toggleBox.height).toBeLessThanOrEqual(avatarBox.y);
    });

    test('renders the default avatar when no custom selection exists', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto('/profile/avatar');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const headerAvatar = page.getByTestId('header-avatar-image');
        await expect(headerAvatar).toHaveAttribute('src', DEFAULT_AVATAR);
    });
});
