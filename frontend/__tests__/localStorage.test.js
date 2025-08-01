/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { getLocalStorage } from '../src/utils/localStorage.js';

describe('getLocalStorage', () => {
    let originalLocalStorage;

    beforeEach(() => {
        originalLocalStorage = window.localStorage;
    });

    afterEach(() => {
        Object.defineProperty(window, 'localStorage', {
            value: originalLocalStorage,
            configurable: true,
            writable: true,
        });
        Object.defineProperty(global, 'localStorage', {
            value: originalLocalStorage,
            configurable: true,
            writable: true,
        });
        jest.restoreAllMocks();
    });

    test('returns entries when localStorage is available', () => {
        Object.defineProperty(global, 'localStorage', {
            value: { a: '1', b: '2' },
            configurable: true,
            writable: true,
        });
        Object.defineProperty(window, 'localStorage', {
            value: global.localStorage,
            configurable: true,
            writable: true,
        });
        const result = getLocalStorage();
        expect(result).toEqual([
            { key: 'a', value: '1' },
            { key: 'b', value: '2' },
        ]);
    });

    test('returns empty array and logs when localStorage missing', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
        Object.defineProperty(global, 'localStorage', {
            value: undefined,
            configurable: true,
            writable: true,
        });
        Object.defineProperty(window, 'localStorage', {
            value: undefined,
            configurable: true,
            writable: true,
        });
        const result = getLocalStorage();
        expect(result).toEqual([]);
        expect(logSpy).toHaveBeenCalledWith('Local storage is not supported by this browser.');
    });

    test('returns empty array when enumeration fails', () => {
        Object.defineProperty(global, 'localStorage', {
            value: {},
            configurable: true,
            writable: true,
        });
        Object.defineProperty(window, 'localStorage', {
            value: global.localStorage,
            configurable: true,
            writable: true,
        });
        jest.spyOn(Object, 'entries').mockImplementation(() => {
            throw new Error('fail');
        });
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const result = getLocalStorage();
        expect(result).toEqual([]);
        expect(errorSpy).toHaveBeenCalled();
    });
});
