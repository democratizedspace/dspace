import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import DataWipePanel from '../DataWipePanel.svelte';

declare const indexedDB: IDBFactory;

const createDeleteRequest = () => {
    const request = {} as IDBOpenDBRequest;
    setTimeout(() => {
        request.onsuccess?.(new Event('success') as unknown as Event);
    }, 0);
    return request;
};

describe('DataWipePanel', () => {
    let confirmSpy: ReturnType<typeof vi.spyOn>;
    let originalIndexedDB: IDBFactory | undefined;

    beforeEach(() => {
        confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        originalIndexedDB = globalThis.indexedDB;
    });

    afterEach(() => {
        confirmSpy.mockRestore();
        globalThis.indexedDB = originalIndexedDB as IDBFactory;
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(';').forEach((cookie) => {
            const name = cookie.split('=')[0]?.trim();
            if (name) {
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            }
        });
        vi.useRealTimers();
    });

    test('clears storage, cookies, and indexedDB when confirmed', async () => {
        const deleteDatabaseMock = vi.fn(createDeleteRequest);
        globalThis.indexedDB = {
            databases: vi.fn().mockResolvedValue([{ name: 'alpha' }, { name: 'beta' }]),
            deleteDatabase: deleteDatabaseMock,
        } as unknown as IDBFactory;

        localStorage.setItem('foo', 'bar');
        sessionStorage.setItem('baz', 'qux');
        document.cookie = 'testCookie=value';

        const { getByText } = render(DataWipePanel);

        await fireEvent.click(getByText('Erase all app data'));

        await waitFor(() => {
            expect(deleteDatabaseMock).toHaveBeenCalledTimes(2);
            expect(localStorage.length).toBe(0);
            expect(sessionStorage.length).toBe(0);
            expect(document.cookie).toBe('');
            expect(getByText('All app data cleared from this device.')).toBeInTheDocument();
        });
    });

    test('exits without clearing when confirmation is rejected', async () => {
        confirmSpy.mockReturnValue(false);
        const deleteDatabaseMock = vi.fn(createDeleteRequest);
        globalThis.indexedDB = {
            databases: vi.fn().mockResolvedValue([{ name: 'gamma' }]),
            deleteDatabase: deleteDatabaseMock,
        } as unknown as IDBFactory;

        localStorage.setItem('keep', 'me');

        const { getByText, queryByTestId } = render(DataWipePanel);

        await fireEvent.click(getByText('Erase all app data'));

        expect(deleteDatabaseMock).not.toHaveBeenCalled();
        expect(localStorage.getItem('keep')).toBe('me');
        expect(queryByTestId('wipe-status')).not.toBeInTheDocument();
        expect(queryByTestId('wipe-error')).not.toBeInTheDocument();
    });
});
