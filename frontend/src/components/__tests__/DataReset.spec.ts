import 'fake-indexeddb/auto';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import DataReset from '../svelte/DataReset.svelte';

const triggerSuccess = (request: IDBOpenDBRequest) => {
    queueMicrotask(() => request.onsuccess?.(new Event('success')));
};

type IndexedDBWithDatabases = IDBFactory & {
    databases?: () => Promise<Array<{ name?: string | null }>>;
};

const indexedDBWithDatabases = indexedDB as IndexedDBWithDatabases;

describe('DataReset', () => {
    beforeEach(() => {
        localStorage.clear();
        document.cookie = '';
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        document.cookie = '';
    });

    it('clears storage, cookies, and indexedDB databases', async () => {
        localStorage.setItem('token', 'abc');
        document.cookie = 'session=123; path=/';
        document.cookie = 'theme=dark; path=/';

        const deleteSpy = vi
            .spyOn(indexedDBWithDatabases, 'deleteDatabase')
            .mockImplementation(() => {
                const request = { onsuccess: null } as unknown as IDBOpenDBRequest;
                triggerSuccess(request);
                return request;
            });

        const databases = vi.fn().mockResolvedValue([{ name: 'db-one' }, { name: 'db-two' }]);
        Object.defineProperty(indexedDBWithDatabases, 'databases', {
            value: databases,
            writable: true,
            configurable: true,
        });

        vi.spyOn(window, 'confirm').mockReturnValue(true);

        const { getByRole, findByText } = render(DataReset);

        await fireEvent.click(getByRole('button', { name: /wipe all app data/i }));

        await waitFor(() => expect(deleteSpy).toHaveBeenCalledTimes(2));
        expect(databases).toHaveBeenCalled();
        expect(localStorage.length).toBe(0);
        expect(document.cookie).not.toMatch(/session|theme/);
        await findByText('All local app data was removed.');
    });

    it('falls back to known database names when enumeration is unavailable', async () => {
        const deleteSpy = vi
            .spyOn(indexedDBWithDatabases, 'deleteDatabase')
            .mockImplementation(() => {
                const request = { onsuccess: null } as unknown as IDBOpenDBRequest;
                triggerSuccess(request);
                return request;
            });

        delete indexedDBWithDatabases.databases;
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        const { getByRole } = render(DataReset);

        await fireEvent.click(getByRole('button', { name: /wipe all app data/i }));

        await waitFor(() => {
            const deletedNames = deleteSpy.mock.calls.map(([name]) => name);
            expect(deletedNames).toEqual(expect.arrayContaining(['dspaceGameState', 'dspaceDB']));
        });
    });
});
