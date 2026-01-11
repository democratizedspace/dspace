import { describe, expect, test } from 'vitest';

import { detectV1CookieItems } from '../src/utils/legacySaveDetection';

describe('detectV1CookieItems', () => {
    test('parses standard v1 item cookies', () => {
        const result = detectV1CookieItems('item-3=75');

        expect(result.items).toEqual([{ id: '3', count: 75 }]);
        expect(result.invalidCookies).toEqual([]);
    });

    test('handles url-encoded plus values', () => {
        const result = detectV1CookieItems('item-21=20%2B');

        expect(result.items).toEqual([{ id: '21', count: 20 }]);
        expect(result.invalidCookies).toEqual([]);
    });

    test('ignores malformed values without failing detection', () => {
        const result = detectV1CookieItems('item-99=abc; item-3=75');

        expect(result.items).toEqual([{ id: '3', count: 75 }]);
        expect(result.invalidCookies).toHaveLength(1);
        expect(result.invalidCookies[0].name).toBe('item-99');
    });
});
