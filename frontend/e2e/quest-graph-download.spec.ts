import fs from 'fs';
import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Quest graph snapshot download', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('downloads a non-empty graph JSON snapshot', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        const diagnosticsTab = page.getByRole('tab', { name: 'Diagnostics' });
        await diagnosticsTab.click();

        const downloadButton = page.getByTestId('download-graph-json');
        await expect(downloadButton).toBeVisible();

        const downloadPromise = page.waitForEvent('download');
        await downloadButton.click();
        const download = await downloadPromise;

        const filePath = await download.path();
        expect(filePath).not.toBeNull();
        if (!filePath) return;

        const content = fs.readFileSync(filePath, 'utf8');
        expect(content.trim().length).toBeGreaterThan(0);

        const parsed = JSON.parse(content);
        expect(Array.isArray(parsed.nodes)).toBe(true);
        expect(parsed.nodes.length).toBeGreaterThan(0);
        expect(typeof parsed.rootKey).toBe('string');
        expect(typeof parsed.buildTimestamp).toBe('string');
    });
});
