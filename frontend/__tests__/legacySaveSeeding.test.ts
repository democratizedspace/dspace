import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import {
    clearSeededLegacySaves,
    clearV3GameStateStorage,
    seedSampleV1CookieSave,
    seedSampleV2LocalStorageSave,
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
    test('seedSampleV1CookieSave writes fixture cookies to document.cookie', () => {
        seedSampleV1CookieSave();

        const cookies = parseCookies();
        expect(cookies).toMatchObject({
            'item-3': '75',
            'item-10': '2',
            'item-83': '1',
            'item-21': '20+',
        });
    });

    test('seedSampleV2LocalStorageSave writes serialized state to legacy keys', () => {
        seedSampleV2LocalStorageSave();

        const gameState = localStorage.getItem('gameState');
        const backup = localStorage.getItem('gameStateBackup');

        expect(gameState).toBeTruthy();
        expect(gameState).toBe(backup);

        const parsed = JSON.parse(gameState || '{}');
        expect(parsed.versionNumberString).toBe('2.1');
        expect(parsed.inventory['3']).toBe(120);
        expect(parsed.quests['welcome/howtodoquests'].finished).toBe(true);
    });

    test('clearSeededLegacySaves removes seeded cookies and localStorage entries', () => {
        seedSampleV1CookieSave();
        seedSampleV2LocalStorageSave();

        clearSeededLegacySaves();

        const cookies = parseCookies();
        expect(cookies).not.toHaveProperty('item-3');
        expect(cookies).not.toHaveProperty('item-10');
        expect(cookies).not.toHaveProperty('item-83');
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
