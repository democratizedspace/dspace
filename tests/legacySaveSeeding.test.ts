import { beforeEach, describe, expect, test } from 'vitest';

import {
    clearLegacyV1CookieSave,
    clearLegacyV2LocalStorageSave,
    legacyV1CookieSeeds,
    legacyV2LocalStorageSeeds,
    seedSampleV1CookieSave,
    seedSampleV2LocalStorageSave,
} from '../frontend/src/dev/legacySaveSeeding';

const readCookies = () => {
    const pairs = document.cookie ? document.cookie.split('; ') : [];
    return Object.fromEntries(
        pairs
            .map((entry) => entry.split('='))
            .filter(([name]) => Boolean(name))
            .map(([name, value = '']) => [decodeURIComponent(name), decodeURIComponent(value)])
    );
};

describe('legacy save seeding helpers', () => {
    beforeEach(() => {
        clearLegacyV1CookieSave();
        clearLegacyV2LocalStorageSave();
    });

    test('seedSampleV1CookieSave writes and clears fixture cookies', () => {
        const seeded = seedSampleV1CookieSave();
        expect(seeded).toBe(true);

        const cookies = readCookies();
        legacyV1CookieSeeds.forEach(({ name, value }) => {
            expect(cookies[name]).toBe(String(value));
        });

        expect(clearLegacyV1CookieSave()).toBe(true);
        const cleared = readCookies();
        legacyV1CookieSeeds.forEach(({ name }) => {
            expect(cleared[name]).toBeUndefined();
        });
    });

    test('seedSampleV2LocalStorageSave writes and clears fixture entries', () => {
        expect(seedSampleV2LocalStorageSave()).toBe(true);

        legacyV2LocalStorageSeeds.forEach(({ key, value }) => {
            expect(localStorage.getItem(key)).toBe(JSON.stringify(value));
        });

        expect(clearLegacyV2LocalStorageSave()).toBe(true);
        legacyV2LocalStorageSeeds.forEach(({ key }) => {
            expect(localStorage.getItem(key)).toBeNull();
        });
    });
});
