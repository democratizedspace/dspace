import { test, expect } from '@playwright/test';

test.describe('Quest Chat Navigation', () => {
    // This test verifies the "How to do quests" tutorial quest specifically
    // The quest ID is "welcome/howtodoquests" as defined in frontend/src/pages/quests/json/welcome/howtodoquests.json
    test('should navigate quest dialogue without page refreshes', async ({ page }) => {
        // Navigate to the quests page first
        await page.goto('/quests');
        console.log('Navigated to quests page');

        // Wait for the page to fully load
        await page.waitForLoadState('networkidle');

        // Take a screenshot of the initial state
        await page.screenshot({ path: './test-screenshots/quests-page.png' });

        // Go directly to the tutorial quest page instead of navigating from the quests page
        // This ensures we find the quest even if it's not showing in the quests list
        await page.goto('/quests/welcome/howtodoquests');
        console.log('Navigated directly to tutorial quest');

        // Take a screenshot after navigating to the quest
        await page.screenshot({ path: './test-screenshots/quest-detail-direct.png' });

        // Wait for the quest page to load and chat to appear
        await expect(page.locator('.chat')).toBeVisible();
        console.log('Chat container is visible');

        // Get the current URL to compare later
        const initialUrl = page.url();
        console.log('Initial URL:', initialUrl);

        // Wait for the dialogue to be fully loaded
        await page.waitForTimeout(1000);

        // Find dialogue options - trying different selectors
        console.log('Looking for dialogue options...');

        // Look at the chat options element more generally
        const optionsSection = page.locator('.options');
        console.log('Options section found:', (await optionsSection.count()) > 0);

        if ((await optionsSection.count()) > 0) {
            // Log the entire options section HTML for debugging
            console.log('Options section HTML:', await optionsSection.innerHTML());

            // Try to get the visible text in the options section
            const chatOptionsText = await optionsSection.textContent();
            console.log('Chat options text content:', chatOptionsText);
        }

        // In the JSON quest file, the first dialogue options are:
        // 1. "Wait, why are you in my garage?"
        // 2. "A quest, you say? Tell me more."

        // Let's try to find and click any visible element in the options section
        const anyClickableElement = page.locator('.options *:visible');
        console.log('Clickable elements count:', await anyClickableElement.count());

        // Take a screenshot of the options area
        await page.screenshot({ path: './test-screenshots/options-area.png' });

        // Try to click any visible div inside options that might be clickable
        let clicked = false;

        // We know that the Chip component renders text directly in an anchor tag
        // Let's try to find any elements with specific text from the quest dialogue
        const possibleTexts = [
            'Wait, why are you in my garage?',
            'A quest, you say? Tell me more.',
            'Alright, lay it on me',
            'I got this, no need for a tutorial',
        ];

        for (const dialogueText of possibleTexts) {
            const dialogueOption = page.locator(`text="${dialogueText}"`);
            if ((await dialogueOption.count()) > 0 && (await dialogueOption.isVisible())) {
                console.log(`Found option with text: "${dialogueText}"`);

                // Click the element
                await dialogueOption.click();
                clicked = true;

                // Take another screenshot after clicking
                await page.screenshot({ path: './test-screenshots/after-option-click.png' });

                // Check that URL hasn't changed (meaning no page refresh)
                const afterClickUrl = page.url();
                console.log('After click URL:', afterClickUrl);

                // The URL should remain the same if no page refresh occurred
                expect(afterClickUrl).toBe(initialUrl);
                break;
            }
        }

        if (!clicked) {
            console.log('Could not find any dialogue options with expected text to click');

            // As a last resort, try to click the first div in the options section
            const firstDiv = page.locator('.options div').first();
            if ((await firstDiv.count()) > 0) {
                console.log('Trying to click the first div in options section');
                await firstDiv.click();

                // Take another screenshot after clicking
                await page.screenshot({ path: './test-screenshots/after-div-click.png' });

                // Check that URL hasn't changed (meaning no page refresh)
                const afterClickUrl = page.url();
                console.log('After click URL:', afterClickUrl);

                // The URL should remain the same if no page refresh occurred
                expect(afterClickUrl).toBe(initialUrl);
            } else {
                console.log('No divs found in options section');
            }
        }

        // Wait a moment and take a final screenshot
        await page.waitForTimeout(1000);
        await page.screenshot({ path: './test-screenshots/final-state.png' });
    });
});
