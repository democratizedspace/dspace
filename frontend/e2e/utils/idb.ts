import type { Page } from '@playwright/test';

const DEFAULT_INDEXED_DB_NAMES = ['CustomContent'];
const LOCAL_STORAGE_KEYS_TO_CLEAR = [
    'dspace::quest-builder::draft',
    'dspace::quests::filters',
    'dspace::quests::sort',
];

async function deleteDatabase(page: Page, name: string): Promise<void> {
    await page.evaluate(
        async (dbName) =>
            new Promise<void>((resolve) => {
                const request = indexedDB.deleteDatabase(dbName);

                request.onblocked = () => {
                    console.warn(`IndexedDB delete blocked for ${dbName}`);
                    resolve();
                };
                request.onerror = () => {
                    console.warn(`IndexedDB delete failed for ${dbName}`, request.error);
                    resolve();
                };
                request.onsuccess = () => resolve();
            }),
        name
    );
}

export async function purgeClientStorage(page: Page): Promise<void> {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const databaseNames = await page.evaluate(async () => {
        if (typeof indexedDB.databases === 'function') {
            try {
                const databases = await indexedDB.databases();
                return databases.map((database) => database.name).filter(Boolean) as string[];
            } catch (error) {
                console.warn('Failed to enumerate IndexedDB databases', error);
            }
        }

        return [];
    });

    const uniqueDatabaseNames = Array.from(
        new Set([...DEFAULT_INDEXED_DB_NAMES, ...databaseNames])
    ).filter(Boolean);

    for (const dbName of uniqueDatabaseNames) {
        await deleteDatabase(page, dbName);
    }

    await page.evaluate((keys) => {
        try {
            keys.forEach((key) => localStorage.removeItem(key));
            localStorage.removeItem('quest-builder-last-step');
            sessionStorage.clear();
        } catch (error) {
            console.warn('Failed to clear web storage state', error);
        }
    }, LOCAL_STORAGE_KEYS_TO_CLEAR);
}
