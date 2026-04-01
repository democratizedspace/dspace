import 'fake-indexeddb/auto';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DataReset from '../svelte/DataReset.svelte';

const triggerSuccess = (request: IDBOpenDBRequest) => {
    queueMicrotask(() => request.onsuccess?.(new Event('success')));
};

type IndexedDBWithDatabases = IDBFactory & {
    databases?: () => Promise<Array<{ name?: string | null }>>;
};
type GlobalWithIndexedDB = typeof globalThis & {
    indexedDB?: IDBFactory;
};

const indexedDBWithDatabases = indexedDB as IndexedDBWithDatabases;
const globalWithIndexedDB = globalThis as GlobalWithIndexedDB;
const originalLocation = globalThis.location;
const originalIndexedDB = globalThis.indexedDB;
const flushMicrotasks = () => new Promise((resolve) => queueMicrotask(resolve));
let reloadSpy: ReturnType<typeof vi.fn>;
const setWindowLocation = (value: Location | undefined) => {
    try {
        Object.defineProperty(window, 'location', {
            configurable: true,
            value,
        });
    } catch {
        delete (window as { location?: Location }).location;
        (window as Window).location = value as Location;
    }
};

describe('DataReset', () => {
    beforeEach(() => {
        localStorage.clear();
        document.cookie = '';
        reloadSpy = vi.fn();
        const mockLocation = {
            ...originalLocation,
            reload: reloadSpy,
        };
        setWindowLocation(mockLocation);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        document.cookie = '';
        setWindowLocation(originalLocation);
        Object.defineProperty(globalThis, 'indexedDB', {
            value: originalIndexedDB,
            configurable: true,
        });
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
            expect(deletedNames).toEqual(
                expect.arrayContaining([
                    'dspaceGameState',
                    'dspaceDB',
                    'dspaceGameSaves',
                    'CustomContent',
                ])
            );
        });
    });

    it('stops when the user cancels the confirmation', async () => {
        localStorage.setItem('token', 'abc');
        document.cookie = 'session=123; path=/';

        const deleteSpy = vi.spyOn(indexedDBWithDatabases, 'deleteDatabase');
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        const { getByRole, queryByText } = render(DataReset);

        await fireEvent.click(getByRole('button', { name: /wipe all app data/i }));

        expect(deleteSpy).not.toHaveBeenCalled();
        expect(localStorage.getItem('token')).toBe('abc');
        expect(document.cookie).toMatch(/session=123/);
        expect(queryByText(/app data was removed/i)).toBeNull();
    });

    it('does not start a second wipe while one is in progress', async () => {
        const pendingRequests: IDBOpenDBRequest[] = [];

        const deleteSpy = vi
            .spyOn(indexedDBWithDatabases, 'deleteDatabase')
            .mockImplementation(() => {
                const request = {
                    onsuccess: null,
                    onerror: null,
                    onblocked: null,
                } as unknown as IDBOpenDBRequest;
                pendingRequests.push(request);
                return request;
            });

        const databases = vi.fn().mockResolvedValue([{ name: 'db-one' }]);
        Object.defineProperty(indexedDBWithDatabases, 'databases', {
            value: databases,
            writable: true,
            configurable: true,
        });

        vi.spyOn(window, 'confirm').mockReturnValue(true);

        const { getByRole, findByText } = render(DataReset);
        const button = getByRole('button', { name: /wipe all app data/i });

        await fireEvent.click(button);
        await fireEvent.click(button);

        expect(deleteSpy).toHaveBeenCalledTimes(1);
        expect(databases).toHaveBeenCalledTimes(1);

        pendingRequests.forEach((request) => request.onsuccess?.(new Event('success')));

        await findByText('All local app data was removed.');
    });

    it('surfaces a partial failure message when any step fails', async () => {
        const deleteSpy = vi
            .spyOn(indexedDBWithDatabases, 'deleteDatabase')
            .mockImplementation(() => {
                const request = {
                    onsuccess: null,
                    onerror: null,
                    onblocked: null,
                } as unknown as IDBOpenDBRequest;

                queueMicrotask(() => request.onerror?.(new Event('error')));

                return request;
            });

        const databases = vi.fn().mockResolvedValue([{ name: 'db-one' }]);
        Object.defineProperty(indexedDBWithDatabases, 'databases', {
            value: databases,
            writable: true,
            configurable: true,
        });

        vi.spyOn(window, 'confirm').mockReturnValue(true);

        const { getByRole, findByText } = render(DataReset);

        await fireEvent.click(getByRole('button', { name: /wipe all app data/i }));

        await findByText(
            'Some local app data may not have been removed. Please try again or clear your browser data manually.'
        );

        expect(deleteSpy).toHaveBeenCalled();
    });

    it('handles unexpected errors by surfacing a warning and skipping reload', async () => {
        Object.defineProperty(globalThis, 'indexedDB', {
            value: null,
            configurable: true,
        });
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        const { getByRole, findByText } = render(DataReset);

        await fireEvent.click(getByRole('button', { name: /wipe all app data/i }));

        await findByText(
            'Some local app data may not have been removed. Please try again or clear your browser data manually.'
        );

        expect(reloadSpy).not.toHaveBeenCalled();
    });

    it('expires cookies across hostname and parent-domain combinations', async () => {
        setWindowLocation({ hostname: 'app.example.com', pathname: '/foo/bar' } as Location);

        document.cookie = 'session=123; path=/';

        const cookieSetter = vi.spyOn(document, 'cookie', 'set');

        vi.spyOn(window, 'confirm').mockReturnValue(true);

        const { getByRole, findByText } = render(DataReset);

        await fireEvent.click(getByRole('button', { name: /wipe all app data/i }));
        await findByText('All local app data was removed.');

        const writes = cookieSetter.mock.calls.map(([value]) => value as string);

        expect(writes.some((value) => value.includes('domain=app.example.com'))).toBe(true);
        expect(writes.some((value) => value.includes('domain=.example.com'))).toBe(true);
        expect(writes.some((value) => value.includes('path=/foo'))).toBe(true);
    });

    it('clears cookies when location information is unavailable', async () => {
        setWindowLocation(undefined);

        document.cookie = 'session=123; path=/';

        const deleteSpy = vi
            .spyOn(indexedDBWithDatabases, 'deleteDatabase')
            .mockImplementation(() => {
                const request = {
                    onsuccess: null,
                    onerror: null,
                    onblocked: null,
                } as unknown as IDBOpenDBRequest;

                queueMicrotask(() => request.onerror?.(new Event('error')));

                return request;
            });

        vi.spyOn(window, 'confirm').mockReturnValue(true);

        const { getByRole, findByText } = render(DataReset);

        await fireEvent.click(getByRole('button', { name: /wipe all app data/i }));

        await findByText(
            'Some local app data may not have been removed. Please try again or clear your browser data manually.'
        );

        expect(deleteSpy).toHaveBeenCalled();
        expect(document.cookie).not.toMatch(/session=123/);
    });

    describe('reload behavior', () => {
        beforeEach(() => {
            delete globalWithIndexedDB.indexedDB;
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('reloads the page after a confirmed wipe', async () => {
            vi.spyOn(window, 'confirm').mockReturnValue(true);

            const { getByRole } = render(DataReset);

            await fireEvent.click(getByRole('button', { name: /wipe all app data/i }));

            await tick();
            await flushMicrotasks();
            vi.runAllTimers();

            expect(reloadSpy).toHaveBeenCalledTimes(1);
        });

        it('does not reload when the user cancels the wipe', async () => {
            vi.spyOn(window, 'confirm').mockReturnValue(false);

            const { getByRole } = render(DataReset);

            await fireEvent.click(getByRole('button', { name: /wipe all app data/i }));

            await tick();
            await flushMicrotasks();
            vi.runAllTimers();

            expect(reloadSpy).not.toHaveBeenCalled();
        });
    });
});
