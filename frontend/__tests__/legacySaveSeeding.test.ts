import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import {
    clearSeededLegacySaves,
    clearV3GameStateStorage,
    getLegacyV1SeedItems,
    seedLegacyV1Save,
    seedLegacyV2LocalStorageSave,
} from '../src/utils/legacySaveSeeding';
import { V1_CURRENCY_SYMBOL_TO_V3_ITEM_ID } from '../src/utils/legacyV1ItemIdMap.js';

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
    test('seedLegacyV1Save writes minimal fixture cookies to document.cookie', () => {
        seedLegacyV1Save('minimal');

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

    test('seedLegacyV1Save and seedLegacyV2LocalStorageSave return stable summaries', () => {
        const v1Summary = seedLegacyV1Save('minimal');
        const v2Summary = seedLegacyV2LocalStorageSave('minimal');

        expect(v1Summary.cookies).toEqual([
            'acceptedCookies',
            'item-3',
            'item-10',
            'item-20',
            'item-22',
            'item-70',
            'currency-balance-dUSD',
        ]);
        expect(v1Summary.localStorageKeys).toEqual([]);
        expect(v2Summary.cookies).toEqual([]);
        expect(v2Summary.localStorageKeys).toEqual(['gameState']);
    });

    test('seedLegacyV1Save writes maximal localStorage keys', () => {
        seedLegacyV1Save('maximal');

        expect(localStorage.getItem('process-3dprint-benchy-starttime')).toBe('1700000000000');
        expect(localStorage.getItem('machine-lock-0')).toBe('1');
    });

    test('getLegacyV1SeedItems includes currency balances for v1 profiles', () => {
        const seedItems = getLegacyV1SeedItems('minimal');
        const currencyItem = seedItems.find((item) => item.v1Key === 'currency-balance-dUSD');

        expect(currencyItem).toMatchObject({
            v1Key: 'currency-balance-dUSD',
            v1Name: 'dUSD',
            v3Id: V1_CURRENCY_SYMBOL_TO_V3_ITEM_ID.dUSD,
            v3Name: 'dUSD',
        });
    });

    test('seedLegacyV2LocalStorageSave writes serialized state to gameState', () => {
        seedLegacyV2LocalStorageSave('minimal');

        const gameState = localStorage.getItem('gameState');
        const backup = localStorage.getItem('gameStateBackup');

        const parsed = JSON.parse(gameState || '{}');
        expect(parsed.versionNumberString).toBe('2.1');
        expect(parsed.inventory['3']).toBe(120.5);
        expect(parsed.processes).toEqual({});
        expect(backup).toBeNull();
    });

    test('seedLegacyV2LocalStorageSave supports in-progress and messy profiles', () => {
        seedLegacyV2LocalStorageSave('inProgress');
        const inProgress = JSON.parse(localStorage.getItem('gameState') || '{}');
        expect(inProgress.processes['processes/benchy'].duration).toBe(3600000);
        expect(inProgress.quests['hydroponics/basil'].stepId).toBe('grown');

        localStorage.clear();
        seedLegacyV2LocalStorageSave('messy');
        const messy = JSON.parse(localStorage.getItem('gameState') || '{}');
        expect(messy.inventory['']).toBe(0);
        expect(messy.openAI.apiKey).toBe('REDACTED');
        expect(messy.misc.flag).toBe(true);
    });

    test('clearSeededLegacySaves removes seeded cookies and localStorage entries', () => {
        seedLegacyV1Save('minimal');
        seedLegacyV2LocalStorageSave('minimal');

        clearSeededLegacySaves();

        const cookies = parseCookies();
        expect(cookies).not.toHaveProperty('item-3');
        expect(cookies).not.toHaveProperty('item-10');
        expect(cookies).not.toHaveProperty('currency-balance-dUSD');
        expect(localStorage.getItem('gameState')).toBeNull();
        expect(localStorage.getItem('gameStateBackup')).toBeNull();
    });

    test('clearV3GameStateStorage deletes v3 IndexedDB keys without removing legacy v2 data', async () => {
        localStorage.setItem('gameState', JSON.stringify({ inventory: { 1: 1 } }));
        localStorage.setItem('gameStateBackup', JSON.stringify({ inventory: { 1: 1 } }));
        localStorage.setItem('root', JSON.stringify({ version: 3 }));
        localStorage.setItem('state', JSON.stringify({ version: 3 }));
        localStorage.setItem('backup', JSON.stringify({ version: 3 }));

        const cleared = await clearV3GameStateStorage();

        expect(cleared).toBe(true);
        expect(localStorage.getItem('root')).toBeNull();
        expect(localStorage.getItem('state')).toBeNull();
        expect(localStorage.getItem('backup')).toBeNull();
        expect(localStorage.getItem('gameState')).not.toBeNull();
        expect(localStorage.getItem('gameStateBackup')).not.toBeNull();
    });
});
