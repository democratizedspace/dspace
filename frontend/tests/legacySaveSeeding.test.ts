import { beforeEach, describe, expect, it } from 'vitest';

import {
    clearSeededLegacySaves,
    LEGACY_V1_SEED_PROFILES,
    LEGACY_V2_SEED_PROFILES,
    seedSampleV1CookieSave,
    seedSampleV2LocalStorageSave,
} from '../src/utils/legacySaveSeeding';

const clearCookies = () => {
    document.cookie.split(';').forEach((cookie) => {
        const name = cookie.split('=')[0]?.trim();
        if (!name) return;
        document.cookie = `${name}=; Max-Age=0; path=/`;
    });
};

const getCookieValue = (name: string) => {
    const entry = document.cookie
        .split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${name}=`));
    return entry ? entry.split('=').slice(1).join('=') : undefined;
};

describe('legacy save seeding', () => {
    beforeEach(() => {
        clearSeededLegacySaves();
        clearCookies();
        localStorage.clear();
    });

    it('seeds v1 minimal cookies without localStorage', () => {
        const summary = seedSampleV1CookieSave('minimal');
        const profile = LEGACY_V1_SEED_PROFILES.minimal;

        expect(summary.profileId).toBe('minimal');
        expect(summary.cookiesWritten).toEqual(profile.cookies?.map((cookie) => cookie.name));
        expect(summary.localStorageWritten).toEqual([]);

        profile.cookies?.forEach((cookie) => {
            const value = getCookieValue(cookie.name);
            expect(value).toBeDefined();
        });

        expect(localStorage.length).toBe(0);
    });

    it('seeds v1 maximal cookies and localStorage keys', () => {
        const summary = seedSampleV1CookieSave('maximal');
        const profile = LEGACY_V1_SEED_PROFILES.maximal;

        expect(summary.profileId).toBe('maximal');
        expect(summary.cookiesWritten).toEqual(profile.cookies?.map((cookie) => cookie.name));
        expect(summary.localStorageWritten).toEqual(
            profile.localStorage?.map((entry) => entry.key)
        );

        profile.localStorage?.forEach((entry) => {
            expect(localStorage.getItem(entry.key)).toBe(String(entry.value));
        });
    });

    it('seeds v2 minimal state into localStorage gameState only', () => {
        const summary = seedSampleV2LocalStorageSave('minimal');
        const profile = LEGACY_V2_SEED_PROFILES.minimal;

        expect(summary.profileId).toBe('minimal');
        expect(summary.localStorageWritten).toEqual(['gameState']);
        expect(localStorage.getItem('gameStateBackup')).toBeNull();
        expect(JSON.parse(localStorage.getItem('gameState') || '{}')).toEqual(profile.gameState);
    });

    it('seeds messy v2 state exactly as configured', () => {
        seedSampleV2LocalStorageSave('messy');
        const profile = LEGACY_V2_SEED_PROFILES.messy;

        expect(JSON.parse(localStorage.getItem('gameState') || '{}')).toEqual(profile.gameState);
    });
});
