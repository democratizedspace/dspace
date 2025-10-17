import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Cloud Sync', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('renders upload form', async ({ page }) => {
        await page.goto('/cloudsync');
        await waitForHydration(page);
        await expect(page.getByLabel('GitHub Token*')).toBeVisible();
        await expect(page.getByRole('button', { name: /Upload/i })).toBeVisible();
    });

    test('uploads and downloads game state with mocked network', async ({ page }) => {
        const gistId = 'gist-mocked-123';
        const mockGitHubKeyPrefix = ['g', 'h', 'p'].join('');
        const mockGitHubKey = `${mockGitHubKeyPrefix}_${'a'.repeat(36)}`;

        await page.route('https://api.github.com/gists', async (route) => {
            const method = route.request().method();
            if (method === 'POST' || method === 'PATCH') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: gistId,
                        files: { 'dspace-save.json': { content: '{}' } },
                    }),
                });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ files: {} }),
            });
        });

        await page.route(`https://api.github.com/gists/${gistId}`, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: gistId,
                    files: {
                        'dspace-save.json': {
                            content: JSON.stringify({
                                items: [],
                                processes: [],
                                quests: [],
                            }),
                        },
                    },
                }),
            });
        });

        await page.goto('/cloudsync');
        await waitForHydration(page);

        const tokenField = page.getByLabel('GitHub Token*');
        await tokenField.fill(mockGitHubKey);
        await page.getByRole('button', { name: /^Save$/i }).click();

        await page.getByRole('button', { name: /^Upload$/i }).click();
        await expect(page.getByTestId('sync-success')).toHaveText('Upload successful');
        await expect(page.getByLabel('Gist ID')).toHaveValue(gistId);

        await page.getByRole('button', { name: /^Download$/i }).click();
        await expect(page.getByTestId('sync-success')).toHaveText('Download successful');

        const readStoredGistId = async () =>
            page.evaluate(async () => {
                const openRequest = indexedDB.open('dspaceGameState');
                const db: IDBDatabase = await new Promise((resolve, reject) => {
                    openRequest.onsuccess = () => resolve(openRequest.result);
                    openRequest.onerror = () => reject(openRequest.error);
                });

                try {
                    const tx = db.transaction('state', 'readonly');
                    const store = tx.objectStore('state');
                    const request = store.get('root');
                    const state = await new Promise<unknown>((resolve, reject) => {
                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => reject(request.error);
                    });

                    return (state as { cloudSync?: { gistId?: string } })?.cloudSync?.gistId ?? '';
                } finally {
                    db.close();
                }
            });

        await expect.poll(readStoredGistId).toBe(gistId);
    });
});
