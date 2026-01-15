import { beforeEach, describe, expect, it } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import 'fake-indexeddb/auto';
import items from '../../json/items/index.js';
import { db } from '../../../../utils/customcontent.js';
import { resetItemResolverCache } from '../../../../utils/itemResolver.js';
import ItemPage from '../ItemPage.svelte';

const CUSTOM_DB_NAME = 'CustomContent';
const CUSTOM_DB_VERSION = 3;

async function clearCustomContentItems() {
    const request = indexedDB.open(CUSTOM_DB_NAME, CUSTOM_DB_VERSION);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        request.onupgradeneeded = () => {
            const upgradeDb = request.result;
            if (!upgradeDb.objectStoreNames.contains('meta')) {
                const metaStore = upgradeDb.createObjectStore('meta');
                metaStore.put(CUSTOM_DB_VERSION, 'schemaVersion');
            }
            if (!upgradeDb.objectStoreNames.contains('items')) {
                upgradeDb.createObjectStore('items', { keyPath: 'id' });
            }
            if (!upgradeDb.objectStoreNames.contains('processes')) {
                upgradeDb.createObjectStore('processes', { keyPath: 'id' });
            }
            if (!upgradeDb.objectStoreNames.contains('quests')) {
                upgradeDb.createObjectStore('quests', { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    try {
        if (!db.objectStoreNames.contains('items')) {
            return;
        }
        const tx = db.transaction('items', 'readwrite');
        tx.objectStore('items').clear();
        await new Promise<void>((resolve) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
            tx.onabort = () => resolve();
        });
    } finally {
        db.close();
    }
}

describe('ItemPage', () => {
    beforeEach(async () => {
        resetItemResolverCache();
        await clearCustomContentItems();
    });

    it('renders built-in item metadata and icon', async () => {
        const builtIn = items[0];
        const { container } = render(ItemPage, {
            props: { itemId: builtIn.id },
        });

        await waitFor(() => {
            const heading = container.querySelector('h2');
            expect(heading?.textContent).toBe(builtIn.name);
        });

        await waitFor(() => {
            const heroImage = container.querySelector('.vertical > img');
            expect(heroImage?.getAttribute('src')).toContain(builtIn.image);
        });

        await waitFor(() => {
            const listContainer = container.querySelectorAll('.Container')[0];
            const iconImage = listContainer?.querySelector('img.icon');
            expect(iconImage?.getAttribute('src')).toContain(builtIn.image);
        });
    });

    it('renders custom item metadata and matches hero/icon sources', async () => {
        const customId = 'custom-item-foobar';
        const customImage = 'data:image/png;base64,Zm9v';

        await db.items.add({
            id: customId,
            name: 'foobar',
            description: 'foo bar baz',
            image: customImage,
        });

        const { container } = render(ItemPage, {
            props: { itemId: customId },
        });

        await waitFor(() => {
            const heading = container.querySelector('h2');
            expect(heading?.textContent).toBe('foobar');
        });

        await waitFor(() => {
            const heroImage = container.querySelector('.vertical > img');
            expect(heroImage?.getAttribute('src')).toBe(customImage);
        });

        await waitFor(() => {
            const listContainer = container.querySelectorAll('.Container')[0];
            const iconImage = listContainer?.querySelector('img.icon');
            expect(iconImage?.getAttribute('src')).toBe(customImage);
        });
    });
});
