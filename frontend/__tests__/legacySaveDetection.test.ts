import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { detectLegacyArtifacts, detectV1CookieItems } from '../src/utils/legacySaveDetection';

beforeEach(() => {
    document.cookie = '';
    localStorage.clear();
});

afterEach(() => {
    document.cookie = '';
    localStorage.clear();
});

describe('detectLegacyArtifacts', () => {
    test('detects legacy v1 item cookies', () => {
        document.cookie = 'item-3=75; path=/';

        const result = detectLegacyArtifacts();

        expect(result.hasV1Cookies).toBe(true);
        expect(result.hasV2LocalStorage).toBe(false);
    });

    test('detects legacy v2 localStorage keys with version markers', () => {
        localStorage.setItem('gameState', JSON.stringify({ versionNumberString: '2.1' }));

        const result = detectLegacyArtifacts();

        expect(result.hasV1Cookies).toBe(false);
        expect(result.hasV2LocalStorage).toBe(true);
    });

    test('ignores v3 localStorage snapshots', () => {
        localStorage.setItem('gameState', JSON.stringify({ versionNumberString: '3' }));
        localStorage.setItem('gameStateBackup', JSON.stringify({ versionNumberString: '3.0' }));

        const result = detectLegacyArtifacts();

        expect(result.hasV1Cookies).toBe(false);
        expect(result.hasV2LocalStorage).toBe(false);
    });

    test('returns false when no artifacts are present', () => {
        const result = detectLegacyArtifacts();

        expect(result.hasV1Cookies).toBe(false);
        expect(result.hasV2LocalStorage).toBe(false);
    });
});

describe('detectV1CookieItems', () => {
    test('parses standard item cookie values', () => {
        const result = detectV1CookieItems('item-3=75; item-10=2');

        expect(result.items).toEqual([
            { id: '3', count: 75 },
            { id: '10', count: 2 },
        ]);
        expect(result.hasLegacyCookies).toBe(true);
        expect(result.invalidCookies).toHaveLength(0);
    });

    test('accepts URL-encoded plus values without invalidating detection', () => {
        const result = detectV1CookieItems('item-21=20%2B');

        expect(result.items).toEqual([{ id: '21', count: 20 }]);
        expect(result.hasLegacyCookies).toBe(true);
        expect(result.invalidCookies).toHaveLength(0);
    });

    test('ignores malformed values without failing detection', () => {
        const result = detectV1CookieItems('item-99=abc');

        expect(result.items).toEqual([]);
        expect(result.hasLegacyCookies).toBe(true);
        expect(result.invalidCookies).toEqual([
            { name: 'item-99', value: 'abc', reason: 'Invalid count.' },
        ]);
    });
});
