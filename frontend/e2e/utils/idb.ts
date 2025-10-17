import { Page } from '@playwright/test';

const CLIENT_DATABASES = ['CustomContent', 'dspaceGameState'];

export async function resetClientStorage(page: Page): Promise<void> {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.evaluate(async ({ dbNames }) => {
        const deleteDatabase = async (name: string): Promise<void> =>
            new Promise((resolve, reject) => {
                try {
                    const request = indexedDB.deleteDatabase(name);
                    request.onsuccess = () => resolve();
                    request.onerror = () =>
                        reject(
                            new Error(
                                `Failed to delete IndexedDB database "${name}": ${
                                    request.error?.message || request.error || 'unknown error'
                                }`
                            )
                        );
                    request.onblocked = () => {
                        console.warn(`Delete for IndexedDB database "${name}" was blocked.`);
                    };
                } catch (error) {
                    reject(error);
                }
            });

        for (const dbName of dbNames) {
            try {
                await deleteDatabase(dbName);
            } catch (error) {
                console.warn(`Unable to remove IndexedDB database "${dbName}":`, error);
            }
        }

        try {
            localStorage.clear();
        } catch (error) {
            console.warn('Unable to clear localStorage:', error);
        }
    }, { dbNames: CLIENT_DATABASES });
}
