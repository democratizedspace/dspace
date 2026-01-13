import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import {
    clearSeededLegacySaves,
    clearV3GameStateStorage,
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
    test('seedLegacyV1Profile writes minimal v1 cookies to document.cookie', () => {
        seedLegacyV1Profile('minimal');

        const cookies = parseCookies();
        expect(cookies).toMatchObject({
            acceptedCookies: 'true',
            'item-3': '12.5',
            'item-10': '2',
            'item-20': '3',
            'item-22': '150',
            'item-70': '1',
            'currency-balance-dUSD': '123.45',
        });
    });

    test('seedLegacyV1Profile writes maximal v1 localStorage entries', () => {
        seedLegacyV1Profile('maximal');

        expect(localStorage.getItem('process-3dprint-benchy-starttime')).toBe('1700000000000');
        expect(localStorage.getItem('machine-lock-0')).toBe('1');
    });

    test('seedLegacyV2Profile writes serialized state to gameState only', () => {
        seedLegacyV2Profile('minimal');

        const gameState = localStorage.getItem('gameState');
        const backup = localStorage.getItem('gameStateBackup');

        expect(gameState).toBeTruthy();
        expect(backup).toBeNull();

        const parsed = JSON.parse(gameState || '{}');
        expect(parsed.versionNumberString).toBe('2.1');
        expect(parsed.inventory['3']).toBe(120);
        expect(parsed.quests['welcome/howtodoquests'].finished).toBe(true);
    });

    test('seedLegacyV2Profile supports in-progress and messy profiles', () => {
        seedLegacyV2Profile('inProgress');
        const inProgress = JSON.parse(localStorage.getItem('gameState') || '{}');
        expect(inProgress.processes['processes/benchy'].duration).toBe(86400000);

        localStorage.clear();

        seedLegacyV2Profile('messy');
        const messy = JSON.parse(localStorage.getItem('gameState') || '{}');
        expect(messy.inventory['']).toBeNull();
        expect(messy.openAI.apiKey).toBe('REDACTED');
    });

    test('clearSeededLegacySaves removes seeded cookies and localStorage entries', () => {
        seedLegacyV1Profile('minimal');
        seedLegacyV2Profile('minimal');

        clearSeededLegacySaves();

        const cookies = parseCookies();
        expect(cookies).not.toHaveProperty('item-3');
        expect(cookies).not.toHaveProperty('item-10');
        expect(cookies).not.toHaveProperty('item-70');
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
