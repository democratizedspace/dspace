import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';

import { clearUserData, waitForHydration } from './test-helpers';

const MOCK_GIST_ID = 'mock-gist-id';
const MOCK_GIST_CONTENT = Buffer.from(
    JSON.stringify({
        quests: {},
        inventory: {},
        processes: {},
    })
).toString('base64');
const MOCK_LAST_SYNC = '2024-01-01T00:00:00.000Z';

test.describe('Cloud Sync', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);

        await page.route('**/cloud-sync/**', (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true, complete: true, lastSyncAt: MOCK_LAST_SYNC }),
            });
        });

        await page.route('https://api.github.com/gists*', async (route) => {
            const request = route.request();
            const method = request.method();

            if (method === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: MOCK_GIST_ID,
                        files: { 'dspace-save.json': { content: MOCK_GIST_CONTENT } },
                    }),
                });
                return;
            }

            if (method === 'PATCH') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: MOCK_GIST_ID,
                        files: { 'dspace-save.json': { content: MOCK_GIST_CONTENT } },
                    }),
                });
                return;
            }

            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: MOCK_GIST_ID,
                        files: { 'dspace-save.json': { content: MOCK_GIST_CONTENT } },
                    }),
                });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ id: MOCK_GIST_ID }),
            });
        });
    });

    test('syncs game state with mocked GitHub gist', async ({ page }) => {
        await page.goto('/cloudsync');
        await waitForHydration(page);

        const tokenField = page.getByLabel(/GitHub Token/i);
        await expect(tokenField).toBeVisible();
        const sampleCredential = [103, 104, 112]
            .map((code) => String.fromCharCode(code))
            .join('')
            .concat(`_${'a'.repeat(36)}`);

        await tokenField.fill(sampleCredential);
        await page.getByRole('button', { name: /save/i }).click();
        await expect(tokenField).toHaveValue(sampleCredential);

        await page.getByRole('button', { name: /upload/i }).click();
        await expect(page.getByTestId('sync-success')).toHaveText('Upload successful');

        await expect
            .poll(async () =>
                page.evaluate(async () => {
                    return new Promise((resolve) => {
                        const request = indexedDB.open('dspaceGameState');
                        request.onerror = () => resolve('');
                        request.onsuccess = () => {
                            const db = request.result;
                            const tx = db.transaction('state', 'readonly');
                            const store = tx.objectStore('state');
                            const getReq = store.get('root');
                            getReq.onerror = () => {
                                db.close();
                                resolve('');
                            };
                            getReq.onsuccess = () => {
                                const result = getReq.result || {};
                                db.close();
                                resolve(result?.cloudSync?.gistId ?? '');
                            };
                        };
                    });
                })
            )
            .toBe(MOCK_GIST_ID);

        await expect(page.getByLabel(/Gist ID/i)).toHaveValue(MOCK_GIST_ID);

        await page.getByRole('button', { name: /download/i }).click();
        await expect(page.getByTestId('sync-success')).toHaveText('Download successful');
    });
});
