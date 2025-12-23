import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Cloud Sync', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('validates token, uploads new backups, and lists them', async ({ page }) => {
        const created: {
            id: string;
            created_at: string;
            html_url: string;
            filename: string;
        }[] = [];

        await page.route('**/gists?per_page=1', (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
        );

        await page.route('**/gists', (route) => {
            const request = route.request();
            const url = new URL(request.url());
            if (url.searchParams.get('per_page') === '1' && request.method() === 'GET') {
                return route.fulfill({ status: 200, body: '[]' });
            }

            if (request.method() === 'GET') {
                const body = created.map((gist) => ({
                    id: gist.id,
                    created_at: gist.created_at,
                    html_url: gist.html_url,
                    description: 'DSPACE Cloud Sync backup',
                    files: { [gist.filename]: { filename: gist.filename } },
                }));
                return route.fulfill({ status: 200, body: JSON.stringify(body) });
            }

            if (request.method() === 'POST') {
                const payload = JSON.parse(request.postData() || '{}');
                const fileName = Object.keys(payload.files || {})[0];
                const content = payload.files[fileName]?.content || '';
                const decoded = Buffer.from(content, 'base64').toString('utf8');
                expect(decoded.includes('github')).toBe(false);

                const newId = `gist-${created.length + 1}`;
                const created_at = `2024-01-0${created.length + 1}T12:00:00Z`;
                const html_url = `https://gist.github.com/${newId}`;
                created.unshift({ id: newId, created_at, html_url, filename: fileName });
                return route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ id: newId, created_at, html_url }),
                });
            }

            return route.continue();
        });

        await page.route('**/gists/*', (route) => {
            const id = route.request().url().split('/').pop() || '';
            const match = created.find((item) => item.id === id);
            const body = match
                ? {
                      files: {
                          [match.filename]: {
                              filename: match.filename,
                              content: Buffer.from(
                                  JSON.stringify({
                                      quests: { downloaded: true },
                                      inventory: {},
                                      processes: {},
                                  }),
                                  'utf8'
                              ).toString('base64'),
                          },
                      },
                  }
                : { files: {} };

            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(body),
            });
        });

        await page.goto('/cloudsync');
        await waitForHydration(page);
        await expect.poll(() => page.evaluate(() => window.__cloudSyncReady === true)).toBeTruthy();

        const token = `ghp_${'a'.repeat(24)}`;
        const tokenField = page.getByLabel(/GitHub Token/i);
        await tokenField.fill(token);
        const saveButton = page.getByTestId('save-token');
        await saveButton.click();
        await expect(page.getByTestId('sync-success')).toHaveText('Token saved and validated');

        const uploadButton = page.getByRole('button', { name: /upload/i });
        await uploadButton.click();
        await expect(page.getByTestId('sync-success')).toHaveText('Upload successful');
        await expect.poll(() => created.length).toBe(1);
        await expect(page.getByLabel(/Gist ID/i)).toHaveValue('');
        await expect(page.getByTestId('backup-list')).toContainText(created[0].id);
        await expect(page.getByTestId(`backup-link-${created[0].id}`)).toHaveAttribute(
            'href',
            `https://gist.github.com/${created[0].id}`
        );

        await uploadButton.click();
        await expect.poll(() => created.length).toBe(2);
        await expect(page.getByTestId('backup-list')).toContainText(created[0].id);
        expect(created[0].id).not.toBe(created[1].id);

        await page.getByLabel(/Gist ID/i).fill(created[0].id);
        await page.getByRole('button', { name: /download/i }).click();
        await expect(page.getByTestId('sync-success')).toHaveText('Download successful');
    });
});
