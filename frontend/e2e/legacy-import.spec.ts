import { test, expect } from '@playwright/test';
import { clearUserData, navigateWithRetry } from './test-helpers';
import type { Page } from './test-helpers';

const EARLY_ADOPTER_ID = '7cbb9db5-1d15-481e-b0bb-a1eed889063b';

const LEGACY_COOKIE_FIXTURE = [
    { name: 'item-3', value: '75' },
    { name: 'item-10', value: '2' },
    { name: 'item-83', value: '1' },
    { name: 'item-21', value: '20%2B' },
];

const readGameStateFromIndexedDb = async (page: Page) =>
    page.evaluate(async () => {
        const readState = () =>
            new Promise((resolve, reject) => {
                const request = indexedDB.open('dspaceGameState');
                request.onerror = () => reject(request.error || new Error('Failed to open DB'));
                request.onupgradeneeded = () => resolve(null);
                request.onsuccess = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains('state')) {
                        db.close();
                        resolve(null);
                        return;
                    }
                    const tx = db.transaction('state', 'readonly');
                    const store = tx.objectStore('state');
                    const getReq = store.get('root');
                    getReq.onerror = () => {
                        db.close();
                        reject(getReq.error || new Error('Failed to read state'));
                    };
                    getReq.onsuccess = () => {
                        db.close();
                        resolve(getReq.result ?? null);
                    };
                };
            });

        return readState();
    });

test.describe('Legacy data import', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows upgrade path when no v1 cookies are present', async ({ page }) => {
        await navigateWithRetry(page, '/import/v2/v1');
        await expect(page.getByRole('heading', { name: 'Upgrade from v1 to v2' })).toBeVisible();
        await expect(page.getByText("didn't play v1")).toBeVisible();
    });

    test('detects v1 cookies in settings and merges into v3 save', async ({ page }) => {
        await navigateWithRetry(page, '/');

        await page.context().addCookies(
            LEGACY_COOKIE_FIXTURE.map((cookie) => ({
                ...cookie,
                url: page.url(),
                path: '/',
            }))
        );

        await navigateWithRetry(page, '/settings');

        const v1Card = page.locator('.legacy-upgrade .card', { hasText: 'V1 (cookie saves)' });
        await expect(v1Card).toContainText(/item cookies detected/i);

        const mergeButton = v1Card.getByRole('button', { name: 'Merge v1 into current save' });
        await expect(mergeButton).toBeEnabled();
        await mergeButton.click();

        await expect(page.getByText('Merged v1 items into your current save.')).toBeVisible();

        const state = await readGameStateFromIndexedDb(page);
        expect(state?.inventory?.['3']).toBe(75);
        expect(state?.inventory?.['10']).toBe(2);
        expect(state?.inventory?.['21']).toBe(20);
        expect(state?.inventory?.['83']).toBe(1);
        expect(state?.inventory?.[EARLY_ADOPTER_ID]).toBe(1);
    });
});
