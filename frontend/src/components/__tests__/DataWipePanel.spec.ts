import 'fake-indexeddb/auto';

import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { expect, test } from 'vitest';

import DataWipePanel from '../svelte/DataWipePanel.svelte';

async function createDatabase(name: string, storeName: string) {
    await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(name, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
            }
        };
        request.onsuccess = () => {
            request.result.close();
            resolve();
        };
        request.onerror = () => reject(request.error);
    });
}

async function wasDatabaseRecreated(name: string) {
    return new Promise<boolean>((resolve, reject) => {
        const request = indexedDB.open(name);
        let upgraded = false;

        request.onupgradeneeded = (event) => {
            upgraded = true;
            event.target?.result.close();
            resolve(event.oldVersion === 0);
        };

        request.onsuccess = () => {
            request.result.close();
            resolve(upgraded);
        };

        request.onerror = () => reject(request.error);
    });
}

test('wipes localStorage, cookies, and IndexedDB', async () => {
    localStorage.setItem('foo', 'bar');
    document.cookie = 'session=abc; path=/';

    await createDatabase('CustomContent', 'quests');
    await createDatabase('dspaceDB', 'quests');

    const { getByText } = render(DataWipePanel);

    await fireEvent.click(getByText('Wipe all data'));

    await waitFor(() => {
        expect(getByText('All local data cleared. You may need to reload the page.')).toBeDefined();
    });

    expect(localStorage.length).toBe(0);
    expect(document.cookie).not.toContain('session=abc');

    const customContentReset = await wasDatabaseRecreated('CustomContent');
    const dspaceReset = await wasDatabaseRecreated('dspaceDB');

    expect(customContentReset).toBe(true);
    expect(dspaceReset).toBe(true);
});
