import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { clearUserData, waitForHydration } from './test-helpers';

const CUSTOM_CONTENT_DB_VERSION = 3;

async function seedCustomProcess(
    page: import('@playwright/test').Page,
    processRecord: Record<string, unknown>
): Promise<void> {
    await page.evaluate(
        async ({ processRecord, dbVersion }) => {
            const openDatabase = () =>
                new Promise<IDBDatabase>((resolve, reject) => {
                    const request = indexedDB.open('CustomContent', dbVersion);

                    request.onupgradeneeded = () => {
                        const db = request.result;
                        if (!db.objectStoreNames.contains('meta')) {
                            db.createObjectStore('meta');
                        }
                        if (!db.objectStoreNames.contains('items')) {
                            db.createObjectStore('items', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('processes')) {
                            db.createObjectStore('processes', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('quests')) {
                            db.createObjectStore('quests', { keyPath: 'id' });
                        }
                    };

                    request.onerror = () =>
                        reject(
                            request.error ??
                                new Error('Failed to open IndexedDB for process seeding')
                        );
                    request.onsuccess = () => resolve(request.result);
                });

            const db = await openDatabase();
            try {
                await new Promise<void>((resolve, reject) => {
                    const tx = db.transaction('processes', 'readwrite');
                    const store = tx.objectStore('processes');
                    const request = store.put(processRecord);

                    tx.oncomplete = () => resolve();
                    tx.onerror = () =>
                        reject(tx.error ?? new Error('Process seed transaction failed'));
                    tx.onabort = () =>
                        reject(tx.error ?? new Error('Process seed transaction aborted'));

                    request.onerror = () =>
                        reject(request.error ?? new Error('Failed to seed process record'));
                });
            } finally {
                db.close();
            }
        },
        { processRecord, dbVersion: CUSTOM_CONTENT_DB_VERSION }
    );
}

test.describe('Processes metadata loading', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('does not render transient item ids while metadata is loading', async ({ page }) => {
        const missingItemId = `missing-item-${randomUUID()}`;
        const processId = `custom-process-${randomUUID()}`;

        await page.goto('/');

        await seedCustomProcess(page, {
            id: processId,
            title: 'Metadata loading regression process',
            duration: '30s',
            requireItems: [{ id: missingItemId, count: 2 }],
            consumeItems: [],
            createItems: [],
            custom: true,
            entityType: 'process',
            createdAt: new Date().toISOString(),
        });

        await page.addInitScript(
            ({ targetItemId }) => {
                const sightings: string[] = [];
                const checkNode = (node: ParentNode | null) => {
                    if (!node) {
                        return;
                    }
                    const text = node.textContent ?? '';
                    if (text.includes(targetItemId)) {
                        sightings.push(text);
                    }
                };

                const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                        checkNode(mutation.target as ParentNode);
                        for (const addedNode of mutation.addedNodes) {
                            if (addedNode.nodeType === Node.ELEMENT_NODE) {
                                checkNode(addedNode as ParentNode);
                            }
                        }
                    }
                });

                (
                    window as unknown as { __processItemIdSightings?: string[] }
                ).__processItemIdSightings = sightings;
                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                    characterData: true,
                });
            },
            { targetItemId: missingItemId }
        );

        await page.goto('/processes');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        await expect(page.getByText('Metadata loading regression process')).toBeVisible();
        await expect(page.getByText(new RegExp(`2x\\s*${missingItemId}`))).toHaveCount(0);

        const sightings = await page.evaluate(() => {
            return (window as unknown as { __processItemIdSightings?: string[] })
                .__processItemIdSightings;
        });

        expect(sightings ?? []).toHaveLength(0);
    });
});
