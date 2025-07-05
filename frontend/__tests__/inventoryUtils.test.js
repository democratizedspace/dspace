/**
 * @jest-environment jsdom
 */
import { setLocalStorage } from '../src/pages/inventory/utils.js';

describe('setLocalStorage', () => {
    let store;
    beforeEach(() => {
        store = {};
        Object.defineProperty(window, 'localStorage', {
            value: {
                setItem: (k, v) => {
                    store[k] = v;
                },
                getItem: (k) => store[k],
            },
            configurable: true,
        });
    });

    test('stores primitive value', () => {
        setLocalStorage('num', 5);
        expect(JSON.parse(store['num'])).toBe(5);
    });

    test('throws when stored object differs by reference', () => {
        expect(() => setLocalStorage('obj', { a: 1 })).toThrow(
            'Failed to set local storage item obj'
        );
        expect(JSON.parse(store['obj'])).toEqual({ a: 1 });
    });
});
