/**
 * @jest-environment jsdom
 */
import { count } from '../src/config/store.js';

describe('count store', () => {
    beforeEach(() => {
        count.set(0);
    });

    test('starts at zero', () => {
        let value;
        const unsubscribe = count.subscribe((v) => (value = v));
        unsubscribe();
        expect(value).toBe(0);
    });

    test('set and update change the value', () => {
        let value;
        const unsubscribe = count.subscribe((v) => (value = v));
        count.set(5);
        expect(value).toBe(5);
        count.update((n) => n + 2);
        expect(value).toBe(7);
        unsubscribe();
    });
});
