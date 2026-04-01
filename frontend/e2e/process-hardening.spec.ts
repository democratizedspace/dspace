import { expect, test } from '@playwright/test';
import { waitForHydration } from './test-helpers';

test.describe('process hardening metadata', () => {
    test('hides hardening details across process views', async ({ page }) => {
        await page.goto('/processes/manage');
        await waitForHydration(page, 'data-testid=manage-processes');

        const processRow = page.getByTestId('process-row').first();
        await expect(processRow).toBeVisible();
        await expect(processRow.getByText(/Score\s+\d+\/100/i)).toHaveCount(0);
        await expect(processRow.getByText(/Passes:/i)).toHaveCount(0);

        const processId = await processRow.getAttribute('data-process-id');
        if (!processId) {
            throw new Error('Process row is missing a process id');
        }

        const previewToggle = processRow.getByTestId('process-preview-toggle');
        await previewToggle.click();

        const preview = processRow.getByTestId('process-preview');
        await expect(preview).toBeVisible();
        await expect(preview.getByText(/Score\s+\d+\/100/i)).toHaveCount(0);
        await expect(preview.getByText(/Passes:/i)).toHaveCount(0);

        await page.goto(`/processes/${processId}`);
        await waitForHydration(page);

        await expect(page.getByText(/Score\s+\d+\/100/i)).toHaveCount(0);
        await expect(page.getByText(/Passes:/i)).toHaveCount(0);
    });
});
