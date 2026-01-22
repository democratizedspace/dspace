import { test, expect } from '@playwright/test';

test.describe('Quest banner layout', () => {
    test('keeps the banner square and stable across dialogue steps', async ({ page }) => {
        await page.goto('/quests/welcome/howtodoquests');
        await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();

        const banner = page.locator('.quest-banner');
        await expect(banner).toBeVisible();

        const getBannerRect = async () =>
            banner.evaluate((element) => {
                const rect = element.getBoundingClientRect();
                return {
                    x: Math.round(rect.x),
                    y: Math.round(rect.y),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                };
            });

        const expectSquareAndMax = (rect: { width: number; height: number }) => {
            expect(Math.abs(rect.width - rect.height)).toBeLessThanOrEqual(1);
            expect(rect.width).toBeLessThanOrEqual(512);
            expect(rect.height).toBeLessThanOrEqual(512);
        };

        const expectStable = (
            rect: { x: number; y: number; width: number; height: number },
            baseline: { x: number; y: number; width: number; height: number }
        ) => {
            expect(Math.abs(rect.x - baseline.x)).toBeLessThanOrEqual(1);
            expect(Math.abs(rect.y - baseline.y)).toBeLessThanOrEqual(1);
            expect(Math.abs(rect.width - baseline.width)).toBeLessThanOrEqual(1);
            expect(Math.abs(rect.height - baseline.height)).toBeLessThanOrEqual(1);
        };

        const initialRect = await getBannerRect();
        expectSquareAndMax(initialRect);

        for (let step = 0; step < 2; step += 1) {
            const dialogue = page.locator('.npcDialogue');
            const previousText = (await dialogue.textContent()) ?? '';

            const nextButton = page.locator('.options button').first();
            await expect(nextButton).toBeVisible();
            await nextButton.click();

            if (previousText.trim().length > 0) {
                await expect(dialogue).not.toHaveText(previousText);
            }

            const rect = await getBannerRect();
            expectSquareAndMax(rect);
            expectStable(rect, initialRect);
        }
    });
});
