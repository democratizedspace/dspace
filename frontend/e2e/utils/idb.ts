import { Page } from '@playwright/test';

const DEFAULT_DB_NAMES = ['CustomContent', 'dspaceGameState'];
const LOCAL_STORAGE_KEYS = ['avatarUrl', 'theme', 'gameState', 'gameStateBackup'];

type ResetClientStateOptions = {
    navigateToRoot?: boolean;
};

export async function resetClientState(
    page: Page,
    options: ResetClientStateOptions = {}
): Promise<void> {
    const { navigateToRoot = true } = options;

    if (navigateToRoot) {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
    }

    await page.evaluate(
        async ({ dbNames, storageKeys }) => {
            const describeError = (step: string, error: unknown) => {
                if (error && typeof error === 'object' && 'message' in error) {
                    return `${step}: ${(error as { message?: string }).message ?? 'Unknown error'}`;
                }

                return `${step}: ${String(error ?? 'Unknown error')}`;
            };

            const names = new Set(dbNames);

            if (typeof indexedDB?.databases === 'function') {
                try {
                    const existing = await indexedDB.databases();
                    for (const entry of existing) {
                        if (entry?.name) {
                            names.add(entry.name);
                        }
                    }
                } catch (error) {
                    console.warn(describeError('Failed to enumerate IndexedDB databases', error));
                }
            }

            const deleteDatabase = async (name: string) => {
                try {
                    await new Promise<void>((resolve) => {
                        const request = indexedDB.deleteDatabase(name);
                        request.onsuccess = () => resolve();
                        request.onerror = () => {
                            console.warn(
                                describeError(
                                    `IndexedDB deletion error for "${name}"`,
                                    request.error ?? new Error('Unknown error')
                                )
                            );
                            resolve();
                        };
                        request.onblocked = () => {
                            console.warn(`IndexedDB deletion blocked for "${name}"`);
                            resolve();
                        };
                    });
                } catch (error) {
                    console.warn(describeError(`Exception deleting IndexedDB "${name}"`, error));
                }
            };

            await Promise.all(Array.from(names).map(deleteDatabase));

            for (const key of storageKeys) {
                try {
                    localStorage.removeItem(key);
                } catch (error) {
                    console.warn(describeError(`Failed to remove localStorage key "${key}"`, error));
                }
            }
        },
        {
            dbNames: DEFAULT_DB_NAMES,
            storageKeys: LOCAL_STORAGE_KEYS,
        }
    );
}
