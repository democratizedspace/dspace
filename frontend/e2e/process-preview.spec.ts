import { test, expect, type Locator, type Page } from '@playwright/test';
import { clearUserData, waitForHydration, navigateWithRetry } from './test-helpers';

type ToggleDebugState = {
    calls: number;
    before: string;
    after: string;
    cleanupScheduled: number;
    cleanupRan: number;
};

function getToggleDebugState(page: Page): Promise<ToggleDebugState> {
    return page.evaluate<ToggleDebugState>(() => {
        const globalWindow = window as typeof window & {
            __dspace_toggle_preview_calls?: number;
            __dspace_open_preview_before?: string;
            __dspace_open_preview_after?: string;
            __dspace_cleanup_scheduled?: number;
            __dspace_cleanup_ran?: number;
        };

        return {
            calls: globalWindow.__dspace_toggle_preview_calls ?? 0,
            before: globalWindow.__dspace_open_preview_before ?? '',
            after: globalWindow.__dspace_open_preview_after ?? '',
            cleanupScheduled: globalWindow.__dspace_cleanup_scheduled ?? 0,
            cleanupRan: globalWindow.__dspace_cleanup_ran ?? 0,
        };
    });
}

function resetToggleDebugState(page: Page): Promise<void> {
    return page.evaluate(() => {
        const globalWindow = window as typeof window & {
            __dspace_toggle_preview_calls?: number;
            __dspace_open_preview_before?: string;
            __dspace_open_preview_after?: string;
            __dspace_last_toggle_process_id?: string;
            __dspace_cleanup_scheduled?: number;
            __dspace_cleanup_ran?: number;
        };

        globalWindow.__dspace_toggle_preview_calls = 0;
        globalWindow.__dspace_open_preview_before = '';
        globalWindow.__dspace_open_preview_after = '';
        globalWindow.__dspace_last_toggle_process_id = '';
        globalWindow.__dspace_cleanup_scheduled = 0;
        globalWindow.__dspace_cleanup_ran = 0;
    });
}

test.describe('Process preview', () => {
    test.beforeEach(async ({ page }) => {
        page.on('pageerror', (error) => {
            const url = page.url();
            const details = error?.stack || error?.message || String(error);
            console.error(`[pageerror][${url}] ${details}`);
            throw error;
        });

        page.on('console', (message) => {
            console.log(`[console.${message.type()}] ${message.text()}`);
        });

        await clearUserData(page);
    });

    test('reveals and hides process details from the manage view', async ({ page }) => {
        await navigateWithRetry(page, '/processes/manage');
        await waitForHydration(page, 'data-testid=manage-processes');

        const manageProcesses = page.getByTestId('manage-processes');
        await expect(manageProcesses).toHaveAttribute('data-hydrated', 'true', {
            timeout: 15000,
        });

        const processList = manageProcesses.getByTestId('processes-list');
        await expect(processList).toBeVisible();
        await expect(processList).toHaveAttribute('data-preview-open', '', { timeout: 10000 });
        await expect(processList).toHaveAttribute('data-last-toggle', '', { timeout: 10000 });
        await resetToggleDebugState(page);

        const previewOpenValue = async () =>
            (await processList.getAttribute('data-preview-open')) || '';
        const lastToggleValue = async () =>
            (await processList.getAttribute('data-last-toggle')) || '';
        const toggleDebugState = async () => getToggleDebugState(page);

        const rows = processList.getByTestId('process-row');
        await expect(rows.first()).toBeVisible();
        const processIds = await rows.evaluateAll((elements) =>
            elements
                .map((element) => element.getAttribute('data-process-id'))
                .filter((value): value is string => Boolean(value))
        );

        const processId = processIds[0];
        if (!processId) {
            throw new Error('Process row is missing a process id');
        }

        const firstRow = processList.locator(
            `[data-testid="process-row"][data-process-id="${processId}"]`
        );
        await expect(firstRow).toBeVisible();

        const previewButton = firstRow.getByTestId('process-preview-toggle');
        await waitForPreviewButtonReady(previewButton);
        await expect(previewButton).toHaveAttribute('data-process-id', processId);
        await expect(previewButton).toHaveAttribute(
            'aria-controls',
            `process-preview-${processId}`
        );
        await expect.poll(previewOpenValue, { timeout: 10000 }).toBe('');
        await expect.poll(lastToggleValue, { timeout: 10000 }).toBe('');
        await expect.poll(async () => (await toggleDebugState()).calls, { timeout: 10000 }).toBe(0);
        await expect
            .poll(async () => (await toggleDebugState()).after, { timeout: 10000 })
            .toBe('');
        await expect
            .poll(async () => (await toggleDebugState()).cleanupScheduled, { timeout: 10000 })
            .toBe(0);
        await expect
            .poll(async () => (await toggleDebugState()).cleanupRan, { timeout: 10000 })
            .toBe(0);
        await expect(previewButton).toHaveAttribute('aria-expanded', 'false');
        const rowTitle = await firstRow.locator('h3').first().textContent();

        // Click to show preview
        await previewButton.click({ trial: true });
        await previewButton.click({ timeout: 5000 });

        // Wait for preview to appear (verify handler ran first)
        await expect.poll(lastToggleValue, { timeout: 10000 }).toBe(processId);
        await expect.poll(async () => (await toggleDebugState()).calls, { timeout: 10000 }).toBe(1);
        await expect
            .poll(async () => (await toggleDebugState()).after, { timeout: 10000 })
            .toBe(processId);
        await expect
            .poll(async () => (await toggleDebugState()).cleanupScheduled, { timeout: 10000 })
            .toBe(0);
        await expect
            .poll(async () => (await toggleDebugState()).cleanupRan, { timeout: 10000 })
            .toBe(0);
        const preview = firstRow.getByTestId('process-preview');
        await expect(previewButton).toHaveAttribute('aria-expanded', 'true');
        await expect(preview).toHaveCount(1, { timeout: 10000 });
        await expect.poll(previewOpenValue, { timeout: 10000 }).toBe(processId);
        await expect(preview.first()).toBeVisible({ timeout: 10000 });

        if (rowTitle) {
            await expect(preview.first().locator('h3')).toHaveText(rowTitle.trim());
        }
        await expect(preview).toContainText('Duration:');
        await expect(preview.first().locator('li')).not.toHaveCount(0);

        // Wait for preview to be fully rendered
        await page.waitForTimeout(500);

        // Click to hide preview
        await resetToggleDebugState(page);
        await expect
            .poll(async () => (await toggleDebugState()).cleanupScheduled, { timeout: 10000 })
            .toBe(0);
        await expect
            .poll(async () => (await toggleDebugState()).cleanupRan, { timeout: 10000 })
            .toBe(0);
        await waitForPreviewButtonReady(previewButton);
        await previewButton.click({ timeout: 5000 });

        // Wait for it to disappear
        await expect.poll(lastToggleValue, { timeout: 10000 }).toBe(processId);
        await expect.poll(async () => (await toggleDebugState()).calls, { timeout: 10000 }).toBe(1);
        await expect
            .poll(async () => (await toggleDebugState()).after, { timeout: 10000 })
            .toBe('');
        await expect
            .poll(async () => (await toggleDebugState()).cleanupScheduled, { timeout: 10000 })
            .toBe(0);
        await expect
            .poll(async () => (await toggleDebugState()).cleanupRan, { timeout: 10000 })
            .toBe(0);
        await expect(previewButton).toHaveAttribute('aria-expanded', 'false');
        await expect(preview).toHaveCount(0, { timeout: 10000 });
        await expect.poll(previewOpenValue, { timeout: 10000 }).toBe('');
    });

    test('opening another preview closes the previous one', async ({ page }) => {
        await navigateWithRetry(page, '/processes/manage');
        await waitForHydration(page, 'data-testid=manage-processes');

        const manageProcesses = page.getByTestId('manage-processes');
        await expect(manageProcesses).toHaveAttribute('data-hydrated', 'true', {
            timeout: 15000,
        });

        const processList = manageProcesses.getByTestId('processes-list');
        await expect(processList).toBeVisible();
        await expect(processList).toHaveAttribute('data-preview-open', '', { timeout: 10000 });
        await expect(processList).toHaveAttribute('data-last-toggle', '', { timeout: 10000 });
        await resetToggleDebugState(page);

        const previewOpenValue = async () =>
            (await processList.getAttribute('data-preview-open')) || '';
        const lastToggleValue = async () =>
            (await processList.getAttribute('data-last-toggle')) || '';
        const toggleDebugState = async () => getToggleDebugState(page);
        const rows = processList.getByTestId('process-row');
        await expect(rows.first()).toBeVisible();

        const processIds = await rows.evaluateAll((elements) =>
            elements
                .map((element) => element.getAttribute('data-process-id'))
                .filter((value): value is string => Boolean(value))
        );
        const [firstProcessId, secondProcessId] = processIds;

        if (!firstProcessId || !secondProcessId) {
            throw new Error('Process rows are missing process ids');
        }

        const firstRow = processList.locator(
            `[data-testid="process-row"][data-process-id="${firstProcessId}"]`
        );
        const secondRow = processList.locator(
            `[data-testid="process-row"][data-process-id="${secondProcessId}"]`
        );

        await expect(firstRow).toBeVisible();
        await expect(secondRow).toBeVisible();

        const firstPreviewButton = firstRow.getByTestId('process-preview-toggle');
        const secondPreviewButton = secondRow.getByTestId('process-preview-toggle');

        await waitForPreviewButtonReady(firstPreviewButton);
        await waitForPreviewButtonReady(secondPreviewButton);
        await expect(firstPreviewButton).toHaveAttribute('data-process-id', firstProcessId);
        await expect(secondPreviewButton).toHaveAttribute('data-process-id', secondProcessId);

        // Click first preview and wait for it to appear
        await firstPreviewButton.click({ trial: true });
        await firstPreviewButton.click({ timeout: 5000 });
        await expect.poll(lastToggleValue, { timeout: 10000 }).toBe(firstProcessId);
        await expect.poll(async () => (await toggleDebugState()).calls, { timeout: 10000 }).toBe(1);
        await expect
            .poll(async () => (await toggleDebugState()).after, { timeout: 10000 })
            .toBe(firstProcessId);
        await expect
            .poll(async () => (await toggleDebugState()).cleanupScheduled, { timeout: 10000 })
            .toBe(0);
        await expect
            .poll(async () => (await toggleDebugState()).cleanupRan, { timeout: 10000 })
            .toBe(0);
        const firstPreview = firstRow.getByTestId('process-preview');
        await expect(firstPreviewButton).toHaveAttribute('aria-expanded', 'true');
        await expect(firstPreview).toHaveCount(1, { timeout: 10000 });
        await expect.poll(previewOpenValue, { timeout: 10000 }).toBe(firstProcessId);

        // Wait a moment before clicking the second button
        await page.waitForTimeout(500);

        // Click second preview and wait for it to appear while first disappears
        await resetToggleDebugState(page);
        await waitForPreviewButtonReady(secondPreviewButton);
        await secondPreviewButton.click({ trial: true });
        await secondPreviewButton.click({ timeout: 5000 });
        await expect.poll(lastToggleValue, { timeout: 10000 }).toBe(secondProcessId);
        await expect.poll(async () => (await toggleDebugState()).calls, { timeout: 10000 }).toBe(1);
        await expect
            .poll(async () => (await toggleDebugState()).after, { timeout: 10000 })
            .toBe(secondProcessId);
        await expect
            .poll(async () => (await toggleDebugState()).cleanupScheduled, { timeout: 10000 })
            .toBe(0);
        await expect
            .poll(async () => (await toggleDebugState()).cleanupRan, { timeout: 10000 })
            .toBe(0);
        const secondPreview = secondRow.getByTestId('process-preview');
        await expect(secondPreviewButton).toHaveAttribute('aria-expanded', 'true');
        await expect(secondPreview).toHaveCount(1, { timeout: 10000 });
        await expect.poll(previewOpenValue, { timeout: 10000 }).toBe(secondProcessId);
        await expect(firstPreviewButton).toHaveAttribute('aria-expanded', 'false');
        await expect(firstPreview).toHaveCount(0, { timeout: 10000 });
    });
});

async function waitForPreviewButtonReady(button: Locator): Promise<void> {
    await expect(button).toBeAttached({ timeout: 10000 });
    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeVisible({ timeout: 10000 });
    await expect(button).toBeEnabled({ timeout: 10000 });
}
