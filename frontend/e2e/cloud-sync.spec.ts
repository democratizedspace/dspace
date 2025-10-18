import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const MOCK_GIST_ID = 'gist-ci-1234567890';
const MOCK_EXPORT_DATA = {
    files: {
        'dspace-save.json': {
            content: JSON.stringify({ quests: {}, inventory: {}, processes: {} }),
        },
    },
};
const MOCK_EXPORT = JSON.stringify(MOCK_EXPORT_DATA);

test.describe('Cloud Sync', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('uploads and downloads backup data with mocked network', async ({ page }) => {
        await page.route('**/cloud-sync/**', (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
        );
        await page.route('**/gists**', async (route) => {
            const request = route.request();
            const method = request.method();

            if (method === 'POST' || method === 'PATCH') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ id: MOCK_GIST_ID, ...MOCK_EXPORT_DATA }),
                });
                return;
            }

            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: MOCK_EXPORT,
                });
                return;
            }

            await route.continue();
        });

        await page.goto('/cloudsync');
        await waitForHydration(page);
        await expect.poll(() => page.evaluate(() => window.__cloudSyncReady === true)).toBeTruthy();

        const token = `ghp_${'a'.repeat(36)}`;
        const tokenField = page.getByLabel(/GitHub Token/i);
        await expect(tokenField).toBeVisible();
        await tokenField.fill(token);
        await page.getByRole('button', { name: /save/i }).click();

        await page.getByRole('button', { name: /upload/i }).click();
        await expect(page.getByTestId('sync-success')).toHaveText('Upload successful');
        await expect.poll(() => page.getByLabel(/Gist ID/i).inputValue()).toBe(MOCK_GIST_ID);

        await page.getByRole('button', { name: /download/i }).click();
        await expect(page.getByTestId('sync-success')).toHaveText('Download successful');
    });
});
