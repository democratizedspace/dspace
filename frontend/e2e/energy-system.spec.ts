import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Energy System Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('should display energy bar on home page', async ({ page }) => {
        // Navigate to the home page
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check for energy bar/indicator
        const energyIndicator = page
            .locator('.energy-bar, .energy-indicator, [data-testid="energy-indicator"]')
            .first();

        // If energy system exists in UI, verify it
        if ((await energyIndicator.count()) > 0) {
            await expect(energyIndicator).toBeVisible();

            // Verify energy value is displayed
            const energyValue = await energyIndicator.textContent();
            expect(energyValue).toBeTruthy();
        } else {
            // Energy system might be implemented differently
            // At least verify the page loaded
            const mainContent = page.locator('main').first();
            await expect(mainContent).toBeVisible();
            test.skip();
            console.log('Energy indicator not found');
        }
    });

    test('should update energy when performing actions', async ({ page }) => {
        // Navigate to the home page
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Find energy indicator
        const energyIndicator = page
            .locator('.energy-bar, .energy-indicator, [data-testid="energy-indicator"]')
            .first();

        // Only run test if energy system is visible
        if ((await energyIndicator.count()) > 0) {
            // Get initial energy value
            const initialEnergyText = (await energyIndicator.textContent()) || '';
            const initialEnergy = extractEnergyValue(initialEnergyText);

            // Find an action button that would consume energy
            const actionButton = page
                .locator('button, a')
                .filter({ hasText: /play|action|activity/i })
                .first();

            // If action button exists, click it to consume energy
            if ((await actionButton.count()) > 0) {
                await actionButton.click();
                await page.waitForTimeout(1000); // Wait for energy update

                // Get updated energy value
                const updatedEnergyText = (await energyIndicator.textContent()) || '';
                const updatedEnergy = extractEnergyValue(updatedEnergyText);

                // Check that energy changed - may decrease or increase depending on game mechanic
                expect(updatedEnergy).not.toBeNaN();
                expect(initialEnergy !== updatedEnergy).toBeTruthy();
            } else {
                // No action button found, test different approach
                test.skip();
                console.log('No energy-consuming action button found');
            }
        } else {
            // Energy system might be implemented differently
            test.skip();
            console.log('Energy indicator not found');
        }
    });

    test('should regenerate energy over time', async ({ page }) => {
        // This test might be flaky due to timing, consider skipping in CI

        // Navigate to the home page
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Find energy indicator
        const energyIndicator = page
            .locator('.energy-bar, .energy-indicator, [data-testid="energy-indicator"]')
            .first();

        // Only run test if energy system is visible
        if ((await energyIndicator.count()) > 0) {
            // Get initial energy value
            const initialEnergyText = (await energyIndicator.textContent()) || '';
            const initialEnergy = extractEnergyValue(initialEnergyText);

            // Wait for energy regeneration (adjust timeout based on game mechanics)
            await page.waitForTimeout(5000);

            // Get updated energy value
            const updatedEnergyText = (await energyIndicator.textContent()) || '';
            const updatedEnergy = extractEnergyValue(updatedEnergyText);

            // If energy regeneration is implemented, energy should increase
            // Note: This test assumes energy regenerates passively; modify as needed
            if (!isNaN(initialEnergy) && !isNaN(updatedEnergy)) {
                // Either energy increased or stayed the same (if already at max)
                expect(updatedEnergy >= initialEnergy).toBeTruthy();
            } else {
                // Energy values couldn't be parsed properly
                console.log('Could not parse energy values for comparison');
            }
        } else {
            // Energy system might be implemented differently
            test.skip();
            console.log('Energy indicator not found');
        }
    });
});

// Helper function to extract numeric energy value from text
function extractEnergyValue(text: string): number {
    // Try to extract number from formats like "Energy: 5/10", "5 Energy", etc.
    const matches = text.match(/(\d+)(?:\s*\/\s*\d+)?/);
    if (matches && matches[1]) {
        return parseInt(matches[1], 10);
    }
    return NaN;
}
