import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Quest graph download', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('creates a downloadable graph snapshot', async ({ page }, testInfo) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        const downloadButton = page.getByTestId('download-quest-graph');
        await expect(downloadButton).toBeVisible();

        const downloadPromise = page.waitForEvent('download');
        await downloadButton.click();

        const download = await downloadPromise;
        const targetPath = testInfo.outputPath('quest-graph.json');
        await download.saveAs(targetPath);
        const content = await fs.readFile(targetPath, 'utf8');

        expect(content.trim().length).toBeGreaterThan(0);

        const parsed = JSON.parse(content);
        expect(Array.isArray(parsed.nodes)).toBe(true);
        expect(parsed.nodes.length).toBeGreaterThan(0);
    });
});
