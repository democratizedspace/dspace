import fs from 'fs';
import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Quest graph snapshot download', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('downloads a non-empty graph JSON snapshot', async ({ page }, testInfo) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/settings');
        const graphToggle = page.getByTestId('quest-graph-visualizer-toggle');
        await expect(graphToggle).toBeVisible({ timeout: 10000 });
        const isEnabled = (await graphToggle.getAttribute('aria-pressed')) === 'true';
        if (!isEnabled) {
            await graphToggle.click();
        }

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const visualizer = page.locator('.visualizer');
        await expect(visualizer).toBeVisible({ timeout: 30000 });
        await visualizer.scrollIntoViewIfNeeded();

        const diagnosticsTab = page.getByRole('tab', { name: 'Diagnostics' });
        await diagnosticsTab.click();

        const downloadButton = page.getByTestId('download-graph-json');
        await expect(downloadButton).toBeVisible();

        const downloadPromise = page.waitForEvent('download');
        await downloadButton.click();
        const download = await downloadPromise;

        const filePath = testInfo.outputPath('quest-graph.json');
        await download.saveAs(filePath);

        const content = fs.readFileSync(filePath, 'utf8');
        expect(content.trim().length).toBeGreaterThan(0);

        const parsed = JSON.parse(content);
        expect(Array.isArray(parsed.nodes)).toBe(true);
        expect(parsed.nodes.length).toBeGreaterThan(0);
        expect(typeof parsed.capturedAt).toBe('string');
        expect(typeof parsed.rootKey).toBe('string');
        expect(typeof parsed.buildTimestamp).toBe('string');
        expect(typeof parsed.version).toBe('string');
        expect(Array.isArray(parsed.edges)).toBe(true);
        expect(parsed.edges.length).toBeGreaterThan(0);
        expect(parsed.edges.every((edge) => typeof edge.from === 'string')).toBe(true);
        expect(parsed.edges.every((edge) => typeof edge.to === 'string')).toBe(true);
        expect(parsed.diagnostics).toEqual(
            expect.objectContaining({
                counts: expect.objectContaining({
                    missingRefs: expect.any(Number),
                    ambiguousRefs: expect.any(Number),
                    unreachableNodes: expect.any(Number),
                    cycles: expect.any(Number),
                    multiParent: expect.any(Number),
                }),
                missingRefs: expect.any(Array),
                ambiguousRefs: expect.any(Array),
                unreachableNodes: expect.any(Array),
                cycles: expect.any(Array),
                multiParent: expect.any(Array),
            })
        );
    });
});
