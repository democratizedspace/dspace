import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const decodeContent = (encoded: string) =>
    JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as Record<string, unknown>;

type MockFile = { filename: string; content: string };
type MockBackup = {
    id: string;
    created_at: string;
    html_url: string;
    files: Record<string, MockFile>;
};

test.describe('Cloud Sync', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('validates tokens, uploads new gists, and lists backups', async ({ page }) => {
        const uploads: MockBackup[] = [];
        let tokenValidationCalls = 0;
        let offlineRequests = 0;

        const seedBackups: MockBackup[] = [
            {
                id: 'seed-1',
                created_at: '2024-01-01T00:00:00Z',
                html_url: 'https://gist.github.com/seed-1',
                files: {
                    'dspace-save-2024-01-01T00-00-00Z.txt': {
                        filename: 'dspace-save-2024-01-01T00-00-00Z.txt',
                        content: Buffer.from(
                            JSON.stringify({ quests: {}, inventory: {}, processes: {} })
                        ).toString('base64'),
                    },
                },
            },
        ];

        await page.on('request', (request) => {
            if (request.url().includes('offlineWorkerRegistration')) {
                offlineRequests += 1;
            }
        });

        await page.route('**/gists?per_page=1', async (route) => {
            tokenValidationCalls += 1;
            await new Promise((resolve) => setTimeout(resolve, 50));
            await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        });

        await page.route('**/gists', async (route) => {
            const request = route.request();
            if (request.method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([...uploads].reverse().concat(seedBackups)),
                });
                return;
            }

            if (request.method() === 'POST') {
                const payload = JSON.parse(request.postData() || '{}') as {
                    files?: Record<string, { content: string }>;
                };
                const files = payload.files ?? {};
                const [fileName, fileData] = Object.entries(files)[0] ?? [];
                if (!fileName || !fileData) {
                    await route.fulfill({ status: 400, body: 'Missing file data' });
                    return;
                }
                const decoded = decodeContent(fileData.content);
                expect(decoded.github).toBeUndefined();
                const newId = `gist-${uploads.length + 1}`;
                const newBackup: MockBackup = {
                    id: newId,
                    created_at: new Date(Date.UTC(2025, 0, uploads.length + 1)).toISOString(),
                    html_url: `https://gist.github.com/${newId}`,
                    files: {
                        [fileName]: { filename: fileName, content: fileData.content },
                    },
                };
                uploads.push(newBackup);
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify(newBackup),
                });
                return;
            }

            await route.continue();
        });

        await page.route('**/gists/*', async (route) => {
            const backup = uploads[uploads.length - 1] ?? seedBackups[0];
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(backup),
            });
        });

        await page.goto('/cloudsync');
        await waitForHydration(page);
        await expect.poll(() => page.evaluate(() => window.__cloudSyncReady === true)).toBeTruthy();

        const token = `ghp_${'a'.repeat(36)}`;
        const tokenField = page.getByLabel(/GitHub Token/i);
        await tokenField.fill(token);
        const saveButton = page.getByTestId('save-token');
        await saveButton.click();
        await expect(saveButton).toBeDisabled();
        await expect(page.getByTestId('token-success')).toHaveText('Token saved');
        expect(tokenValidationCalls).toBeGreaterThan(0);

        await expect(page.getByRole('heading', { name: 'Backups' })).toBeVisible();
        await expect(page.getByText('seed-1')).toBeVisible();

        const uploadButton = page.getByRole('button', { name: /Upload/i });
        await uploadButton.click();
        await expect(page.getByTestId('sync-success')).toHaveText('Upload successful');
        await expect(page.getByLabel(/Gist ID/i)).toHaveValue('');
        await expect(page.getByText('gist-1', { exact: false })).toBeVisible();

        await uploadButton.click();
        await expect(page.getByText('gist-2', { exact: false })).toBeVisible();
        expect(uploads.map((u) => u.id)).toContain('gist-2');

        expect(offlineRequests).toBe(0);
    });
});
