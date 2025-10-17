import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Cloud Sync', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('mocks upload and download flows', async ({ page }) => {
        const gistId = 'ci-gist-id';
        const backupContent = Buffer.from(
            JSON.stringify({
                items: [],
                processes: [],
                quests: [],
            })
        ).toString('base64');

        await page.route('**/gists**', async (route) => {
            const method = route.request().method();
            const payload = {
                id: gistId,
                files: {
                    'dspace-save.json': {
                        content: backupContent,
                    },
                },
            };

            if (method === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify(payload),
                });
                return;
            }

            if (method === 'PATCH' || method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(payload),
                });
                return;
            }

            await route.continue();
        });

        await page.goto('/cloudsync');
        await waitForHydration(page);
        const tokenInput = page.getByLabel('GitHub Token*');
        await tokenInput.fill('ghp_' + 'b'.repeat(36));
        await page.getByRole('button', { name: /^save$/i }).click();

        await page.getByRole('button', { name: /^upload$/i }).click();
        await expect(page.getByTestId('sync-success')).toHaveText('Upload successful');
        await expect(page.getByLabel('Gist ID')).toHaveValue(gistId);
        await expect
            .poll(async () => {
                return page.evaluate(async () => {
                    const module = await import('/src/utils/cloudSync.js');
                    return module.loadCloudGistId();
                });
            })
            .toBe(gistId);

        await page.getByRole('button', { name: /^download$/i }).click();
        await expect(page.getByTestId('sync-success')).toHaveText('Download successful');
    });
});
