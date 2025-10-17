import { Page } from '@playwright/test';

const FALLBACK_DATABASES = ['CustomContent'];
const LOCAL_STORAGE_KEYS = [
    'dspace:user',
    'dspace:session',
    'quests:lastVisited',
    'quests:recentlyViewed',
];

export async function purgeClientState(page: Page): Promise<void> {
    await page.evaluate(
        async ({ fallbackDatabases, storageKeys }) => {
            const discovered = new Set<string>();

            const deleteDatabase = async (name: string): Promise<void> => {
                await new Promise<void>((resolve) => {
                    const request = indexedDB.deleteDatabase(name);

                    request.onsuccess = () => resolve();
                    request.onerror = () => {
                        console.error(
                            `Failed to delete IndexedDB database "${name}"`,
                            request.error
                        );
                        resolve();
                    };
                    request.onblocked = () => {
                        console.warn(`Deletion of IndexedDB database "${name}" was blocked.`);
                        resolve();
                    };
                });
            };

            if (typeof indexedDB.databases === 'function') {
                try {
                    const databases = await indexedDB.databases();
                    for (const db of databases) {
                        if (db?.name) {
                            discovered.add(db.name);
                        }
                    }
                } catch (error) {
                    console.warn('Unable to enumerate IndexedDB databases', error);
                }
            }

            for (const fallback of fallbackDatabases) {
                discovered.add(fallback);
            }

            for (const name of discovered) {
                await deleteDatabase(name);
            }

            for (const key of storageKeys) {
                localStorage.removeItem(key);
            }
            localStorage.clear();

            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.clear();
            }
        },
        {
            fallbackDatabases: FALLBACK_DATABASES,
            storageKeys: LOCAL_STORAGE_KEYS,
        }
    );
}
