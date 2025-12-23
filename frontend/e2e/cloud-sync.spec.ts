import { test, expect } from '@playwright/test';
import { Buffer } from 'buffer';
import { clearUserData, waitForHydration } from './test-helpers';

type GistFile = { content: string };
type GistBody = { files: Record<string, GistFile> };
type CreatedBackup = GistBody & {
    id: string;
    html_url: string;
    created_at: string;
    description: string;
};

test.describe('Cloud Sync', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('validates token, uploads new backups, and lists them', async ({ page }) => {
        const createdBackups: CreatedBackup[] = [];
        const uploadBodies: GistBody[] = [];

        await page.route('**/gists?per_page=1', (route) => {
            setTimeout(
                () =>
                    route.fulfill({
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                        body: '[]',
                    }),
                150
            );
        });

        await page.route('**/gists?*', async (route) => {
            const request = route.request();
            if (request.url().includes('per_page=1')) {
                await route.continue();
                return;
            }
            if (request.method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(createdBackups),
                });
                return;
            }

            if (request.method() === 'POST') {
                const body = JSON.parse(request.postData() || '{}');
                uploadBodies.push(body);
                const id = `gist-${uploadBodies.length}`;
                const gist = {
                    id,
                    html_url: `https://gist.github.com/${id}`,
                    created_at: new Date(2025, 0, uploadBodies.length).toISOString(),
                    description: 'DSPACE Cloud Sync backup',
                    files: body.files,
                };
                createdBackups.unshift(gist);
                await route.fulfill({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(gist),
                });
                return;
            }

            await route.continue();
        });

        await page.route('**/gists/*', async (route) => {
            const id = route.request().url().split('/').pop();
            const gist = createdBackups.find((g) => g.id === id) ?? createdBackups[0];
            await route.fulfill({
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gist ?? { files: {} }),
            });
        });

        await page.goto('/cloudsync');
        await waitForHydration(page);
        await expect.poll(() => page.evaluate(() => window.__cloudSyncReady === true)).toBeTruthy();

        const token = `ghp_${'a'.repeat(30)}`;
        await page.getByLabel(/GitHub Token/i).fill(token);
        await page.getByRole('button', { name: /save/i }).click();
        await expect(page.getByTestId('token-save-spinner')).toBeVisible();
        await expect(page.getByTestId('sync-success')).toHaveText(/Token saved/i);

        const uploadButton = page.getByRole('button', { name: /upload/i });
        await uploadButton.click();
        await expect(page.getByTestId('sync-success')).toHaveText('Upload successful');
        await expect(page.getByLabel(/Gist ID/i)).toHaveValue('');

        await uploadButton.click();
        await expect(page.getByTestId('sync-success')).toHaveText('Upload successful');

        const backupItems = page.getByTestId('backup-list').locator('li');
        await expect(backupItems).toHaveCount(2);
        await expect(backupItems.nth(0)).toContainText('gist-2');
        await expect(backupItems.nth(1)).toContainText('gist-1');
        await expect(backupItems.nth(0).getByRole('link')).toHaveAttribute(
            'href',
            'https://gist.github.com/gist-2'
        );

        await page.getByRole('button', { name: /download/i }).click();
        await expect(page.getByTestId('sync-success')).toHaveText('Download successful');

        uploadBodies.forEach((body) => {
            const filename = Object.keys(body.files)[0];
            const decoded = JSON.parse(
                Buffer.from(body.files[filename].content, 'base64').toString('utf8')
            );
            expect(decoded.github).toBeUndefined();
        });
    });
});
