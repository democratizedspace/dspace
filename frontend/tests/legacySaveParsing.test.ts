import { describe, expect, test } from 'vitest';

import {
    readLegacyV2LocalStorage,
    parseLegacyV2Raw,
    LEGACY_V2_STORAGE_KEYS,
} from '../src/utils/legacySaveParsing.js';
import { V1_ITEM_ID_TO_V3_UUID } from '../src/utils/legacyV1ItemIdMap.js';

describe('legacy v2 save parsing', () => {
    test('documents the expected legacy storage keys', () => {
        expect(LEGACY_V2_STORAGE_KEYS).toEqual(['gameState', 'gameStateBackup']);
    });

    test('parseLegacyV2Raw accepts wrapped gameState payloads', () => {
        const parsed = parseLegacyV2Raw(
            JSON.stringify({
                gameState: {
                    versionNumberString: '2.1',
                    inventory: { 24: 5 },
                    quests: { demo: { finished: true } },
                },
            })
        );

        expect(parsed.isLegacy).toBe(true);
        expect(parsed.error).toBeNull();
        expect(parsed.state).toEqual({
            inventory: { [V1_ITEM_ID_TO_V3_UUID[24]]: 5 },
            quests: { demo: { finished: true } },
            processes: {},
            settings: undefined,
        });
    });

    test('readLegacyV2LocalStorage falls back to gameStateBackup when gameState is absent', () => {
        const storage = {
            getItem: (key: string) =>
                key === 'gameStateBackup'
                    ? JSON.stringify({
                          versionNumberString: '2.1',
                          inventory: { 1: 3 },
                          quests: { fromBackup: { finished: true } },
                      })
                    : null,
        };

        const result = readLegacyV2LocalStorage(storage);

        expect(result.sourceKey).toBe('gameStateBackup');
        expect(result.state).toEqual({
            inventory: { [V1_ITEM_ID_TO_V3_UUID[1]]: 3 },
            quests: { fromBackup: { finished: true } },
            processes: {},
            settings: undefined,
        });
        expect(result.errors).toEqual([]);
    });

    test('readLegacyV2LocalStorage prefers gameState when both keys contain valid legacy payloads', () => {
        const storage = {
            getItem: (key: string) => {
                if (key === 'gameState') {
                    return JSON.stringify({ versionNumberString: '2.1', inventory: { 1: 1 } });
                }
                if (key === 'gameStateBackup') {
                    return JSON.stringify({ versionNumberString: '2.1', inventory: { 1: 99 } });
                }
                return null;
            },
        };

        const result = readLegacyV2LocalStorage(storage);

        expect(result.sourceKey).toBe('gameState');
        expect(result.state?.inventory[V1_ITEM_ID_TO_V3_UUID[1]]).toBe(1);
    });
});
