import fs from 'fs';
import os from 'os';
import path from 'path';
import { test, expect } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Quest graph download', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('downloads a quest graph snapshot with content', async ({ page }) => {
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

        const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'quest-graph-download-'));
        const targetPath = path.join(tempDir, download.suggestedFilename() ?? 'quest-graph.json');

        try {
            await download.saveAs(targetPath);
            const content = await fs.promises.readFile(targetPath, 'utf8');
            expect(content.trim().length).toBeGreaterThan(0);

            const parsed = JSON.parse(content);
            expect(parsed.nodes?.length ?? 0).toBeGreaterThan(0);
            expect(parsed.edges?.length ?? 0).toBeGreaterThan(0);
        } finally {
            await fs.promises.rm(tempDir, { recursive: true, force: true });
        }
    });
});
