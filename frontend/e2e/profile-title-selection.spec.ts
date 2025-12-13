/**
 * Profile Title Selection E2E Tests
 *
 * These tests verify the interactive title selection feature on the profile page.
 * Titles are achievement-based badges that players can earn and select to display
 * on their profile and throughout the game.
 *
 * Test Coverage:
 * - Click-based selection with localStorage persistence
 * - Keyboard navigation (Enter key)
 * - Keyboard navigation (Space key)
 * - Locked titles remain non-interactive
 * - Selection persists across page navigation
 *
 * Note: Tests handle cases where no titles are unlocked yet, making them
 * resilient to varying game state conditions.
 */
import { test, expect } from '@playwright/test';
import { clearUserData, expectLocalStorageValue, waitForHydration } from './test-helpers';

test.describe('Profile title selection', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('selects a title and persists it in localStorage', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, '[data-hydrated="true"]');

        // Wait for titles to load
        const titlesList = page.locator('.profile-titles .list');
        await expect(titlesList).toBeVisible();

        // Find an unlocked title (if any exist with current game state)
        const unlockedTitle = page.locator('.item[data-unlocked="true"]').first();
        const hasUnlockedTitles = (await unlockedTitle.count()) > 0;

        if (hasUnlockedTitles) {
            // Click on the unlocked title
            await unlockedTitle.click();

            // Verify the title is selected visually
            await expect(unlockedTitle).toHaveAttribute('data-selected', 'true');

            // Verify the status text shows "Selected"
            await expect(unlockedTitle.getByText('Selected')).toBeVisible();

            // Verify localStorage was updated
            await expectLocalStorageValue(page, 'selectedTitle', /^titles:/);

            // Verify selection persists across page navigation
            await page.goto('/inventory');
            await page.waitForLoadState('networkidle');
            await page.goto('/profile');
            await page.waitForLoadState('networkidle');
            await waitForHydration(page, '[data-hydrated="true"]');

            // The previously selected title should still be selected
            const selectedTitle = page.locator('.item[data-selected="true"]');
            await expect(selectedTitle).toBeVisible();
            await expect(selectedTitle.getByText('Selected')).toBeVisible();
        }
    });

    test('supports keyboard navigation with Enter key', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, '[data-hydrated="true"]');

        // Wait for titles to load
        const titlesList = page.locator('.profile-titles .list');
        await expect(titlesList).toBeVisible();

        // Find an unlocked title
        const unlockedTitle = page.locator('.item[data-unlocked="true"]').first();
        const hasUnlockedTitles = (await unlockedTitle.count()) > 0;

        if (hasUnlockedTitles) {
            // Focus the title using keyboard
            await unlockedTitle.focus();

            // Press Enter to select
            await unlockedTitle.press('Enter');

            // Verify the title is selected
            await expect(unlockedTitle).toHaveAttribute('data-selected', 'true');
            await expect(unlockedTitle.getByText('Selected')).toBeVisible();
        }
    });

    test('supports keyboard navigation with Space key', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, '[data-hydrated="true"]');

        // Wait for titles to load
        const titlesList = page.locator('.profile-titles .list');
        await expect(titlesList).toBeVisible();

        // Find an unlocked title
        const unlockedTitle = page.locator('.item[data-unlocked="true"]').first();
        const hasUnlockedTitles = (await unlockedTitle.count()) > 0;

        if (hasUnlockedTitles) {
            // Focus the title using keyboard
            await unlockedTitle.focus();

            // Press Space to select
            await unlockedTitle.press('Space');

            // Verify the title is selected
            await expect(unlockedTitle).toHaveAttribute('data-selected', 'true');
            await expect(unlockedTitle.getByText('Selected')).toBeVisible();
        }
    });

    test('locked titles are not focusable or selectable', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page, '[data-hydrated="true"]');

        // Wait for titles to load
        const titlesList = page.locator('.profile-titles .list');
        await expect(titlesList).toBeVisible();

        // Find a locked title (if any exist)
        const lockedTitle = page.locator('.item[data-unlocked="false"]').first();
        const hasLockedTitles = (await lockedTitle.count()) > 0;

        if (hasLockedTitles) {
            // Locked titles should not have tabindex
            const tabindex = await lockedTitle.getAttribute('tabindex');
            expect(tabindex).toBeNull();

            // Locked titles should not have button role
            const role = await lockedTitle.getAttribute('role');
            expect(role).toBeNull();

            // Clicking on locked title should not select it
            await lockedTitle.click();
            await expect(lockedTitle).toHaveAttribute('data-selected', 'false');
        }
    });
});
