import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Cloud Sync', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('validates tokens, uploads new gists, and lists backups', async ({ page }) => {
        const uploadedBodies: unknown[] = [];
        let createdCounter = 0;
        const backups: Array<{ id: string; created_at: string; html_url: string; files: object }> =
            [];
        let validationCalls = 0;
        let offlineWorkerRequests = 0;

        await page.route('**/scripts/offlineWorkerRegistration.js', (route) => {
            offlineWorkerRequests += 1;
            route.abort();
        });

        await page.route('**/gists?per_page=1', async (route) => {
            validationCalls += 1;
            await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        });

        await page.route('**/gists', async (route) => {
            const request = route.request();
            if (request.method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(backups),
                });
                return;
            }

            if (request.method() === 'POST') {
                createdCounter += 1;
                const body = await request.postDataJSON();
                uploadedBodies.push(body);
                const id = `gist-${createdCounter}`;
                const created_at = new Date(Date.now() + createdCounter * 1_000).toISOString();
                backups.unshift({
                    id,
                    created_at,
                    html_url: `https://gist.github.com/${id}`,
                    files: body.files,
                });
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id,
                        created_at,
                        html_url: `https://gist.github.com/${id}`,
                        files: body.files,
                    }),
                });
                return;
            }

            await route.continue();
        });

        await page.goto('/cloudsync');
        await waitForHydration(page);
        await expect.poll(() => page.evaluate(() => window.__cloudSyncReady === true)).toBeTruthy();

        const token = `ghp_${'a'.repeat(20)}`;
        const tokenField = page.getByLabel(/GitHub Token/i);
        const saveButton = page.getByTestId('save-github-token');
        await tokenField.fill(token);

        const validationResponse = page.waitForResponse('**/gists?per_page=1');
        await saveButton.click();
        await validationResponse;
        await expect(saveButton).toBeEnabled();
        await expect(page.getByTestId('sync-success')).toHaveText(/Token saved/);

        const uploadButton = page.getByTestId('upload-backup');
        await uploadButton.click();
        await expect(page.getByTestId('sync-success')).toHaveText(/Upload successful/);
        await expect(page.getByLabel(/Gist ID/i)).toHaveValue('');

        await uploadButton.click();
        await expect(page.getByTestId('sync-success')).toHaveText(/Upload successful/);

        await page.getByTestId('refresh-backups').click();
        const backupItems = page.getByTestId('backups-list').locator('li');
        await expect(backupItems).toHaveCount(2);
        await expect(backupItems.nth(0).getByRole('link')).toHaveAttribute('href', /gist-2/);

        expect(uploadedBodies).toHaveLength(2);
        expect(JSON.stringify(uploadedBodies[0])).not.toContain('github');
        expect(createdCounter).toBe(2);
        expect(validationCalls).toBeGreaterThan(0);
        expect(offlineWorkerRequests).toBe(0);
    });
});
