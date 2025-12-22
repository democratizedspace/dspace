/** @jest-environment jsdom */
import 'fake-indexeddb/auto';
import '@testing-library/jest-dom';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearBrowserData } from '../frontend/src/utils/clearBrowserData.js';
import DataResetPanel from '../frontend/src/components/svelte/DataResetPanel.svelte';

const DATABASES = ['dspaceGameState', 'dspaceDB', 'CustomContent'];

function seedDatabase(name: string) {
    return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(name, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore('default');
        };
        request.onsuccess = () => {
            request.result.close();
            resolve();
        };
        request.onerror = () => reject(request.error);
    });
}

const seedAllDatabases = () => Promise.all(DATABASES.map(seedDatabase));

function databaseExists(name: string) {
    return new Promise<boolean>((resolve, reject) => {
        let exists = true;
        const request = indexedDB.open(name, 1);
        request.onupgradeneeded = () => {
            exists = false;
            try {
                request.transaction?.abort();
            } catch (error) {
                /* ignore abort errors */
            }
        };
        request.onsuccess = () => {
            request.result.close();
            resolve(exists);
        };
        request.onerror = (event) => {
            const error = event?.target?.error;
            if (error?.name === 'AbortError') {
                resolve(false);
                return;
            }
            reject(error ?? event);
        };
    });
}

describe('clearBrowserData', () => {
    beforeEach(async () => {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie = '';
        localStorage.setItem('foo', 'bar');
        sessionStorage.setItem('bar', 'baz');
        document.cookie = 'demoCookie=abc; path=/';
        document.cookie = 'prefs=xyz; path=/';
        await seedAllDatabases();
    });

    it('removes localStorage, sessionStorage, cookies, and IndexedDB data', async () => {
        await clearBrowserData();
        expect(localStorage.getItem('foo')).toBeNull();
        expect(sessionStorage.getItem('bar')).toBeNull();
        await waitFor(async () => {
            const presence = await Promise.all(DATABASES.map(databaseExists));
            expect(presence.every((value) => value === false)).toBe(true);
        });
        expect(document.cookie).toBe('');
    });
});

describe('DataResetPanel', () => {
    it('shows hazard wipe action and reports success', async () => {
        const { getByTestId, findByRole } = render(DataResetPanel);
        const button = getByTestId('wipe-data-button');
        expect(button).toHaveClass('hazard');
        await fireEvent.click(button);
        const status = await findByRole('status');
        expect(status).toHaveTextContent('All local app data has been removed.');
    });
});
