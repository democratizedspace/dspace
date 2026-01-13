import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import {
    clearSeededLegacySaves,
    clearV3GameStateStorage,
    LEGACY_V1_SEED_PROFILES,
    LEGACY_V2_SEED_PROFILES,
    seedLegacyV1Profile,
    seedLegacyV2Profile,
} from '../src/utils/legacySaveSeeding';

const parseCookies = (): Record<string, string> => {
    if (!document.cookie) return {};

    return document.cookie
        .split('; ')
        .filter(Boolean)
        .reduce<Record<string, string>>((acc, pair) => {
            const [name, value] = pair.split('=');
            if (name) {
                acc[name] = decodeURIComponent(value || '');
            }
            return acc;
        }, {});
};

beforeEach(() => {
    document.cookie = '';
    localStorage.clear();
});

afterEach(() => {
    document.cookie = '';
    localStorage.clear();
});

describe('legacy save seeding utilities', () => {
    test('seedLegacyV1Profile writes fixture cookies to document.cookie', () => {
        const summary = seedLegacyV1Profile('minimal');

        const cookies = parseCookies();
        expect(cookies).toMatchObject({
            acceptedCookies: 'true',
            'item-3': '12.5',
            'item-10': '2',
            'item-22': '150',
            'item-70': '1',
            'currency-balance-dUSD': '123.45',
        });
        expect(summary.profileLabel).toBe(
            LEGACY_V1_SEED_PROFILES.find((profile) => profile.id === 'minimal')?.label
        );
    });

    test('seedLegacyV1Profile maximal writes legacy localStorage keys', () => {
        seedLegacyV1Profile('maximal');

        expect(localStorage.getItem('process-3dprint-benchy-starttime')).toBe('1700000000000');
        expect(localStorage.getItem('machine-lock-0')).toBe('1');
    });

    test('seedLegacyV2Profile writes serialized state to gameState only', () => {
        const summary = seedLegacyV2Profile('minimal');

        const gameState = localStorage.getItem('gameState');
        const backup = localStorage.getItem('gameStateBackup');

        expect(gameState).toBeTruthy();
        expect(backup).toBeNull();

        const parsed = JSON.parse(gameState || '{}');
        expect(parsed.versionNumberString).toBe('2.1');
        expect(parsed.inventory['3']).toBe(120.5);
        expect(parsed.quests['welcome/howtodoquests'].finished).toBe(true);
        expect(summary.profileLabel).toBe(
            LEGACY_V2_SEED_PROFILES.find((profile) => profile.id === 'minimal')?.label
        );
    });

    test('clearSeededLegacySaves removes seeded cookies and localStorage entries', () => {
        seedLegacyV1Profile('minimal');
        seedLegacyV2Profile('minimal');

        clearSeededLegacySaves();

        const cookies = parseCookies();
        expect(cookies).not.toHaveProperty('item-3');
        expect(cookies).not.toHaveProperty('item-10');
        expect(cookies).not.toHaveProperty('currency-balance-dUSD');
        expect(localStorage.getItem('gameState')).toBeNull();
        expect(localStorage.getItem('gameStateBackup')).toBeNull();
    });

    test('clearV3GameStateStorage deletes v3 IndexedDB and localStorage keys', async () => {
        localStorage.setItem('gameState', JSON.stringify({ inventory: { 1: 1 } }));
        localStorage.setItem('gameStateBackup', JSON.stringify({ inventory: { 1: 1 } }));

        const cleared = await clearV3GameStateStorage();

        expect(cleared).toBe(true);
        expect(localStorage.getItem('gameState')).toBeNull();
        expect(localStorage.getItem('gameStateBackup')).toBeNull();
    });
});
