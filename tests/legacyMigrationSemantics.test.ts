import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import {
  closeGameStateDatabaseForTesting,
  loadGameState,
  resetGameState,
} from '../frontend/src/utils/gameState/common.js';
import { importV2V3, VERSIONS } from '../frontend/src/utils/gameState.js';
import { readLegacyV2LocalStorage } from '../frontend/src/utils/legacySaveParsing.js';
import { V1_ITEM_ID_TO_V3_UUID } from '../frontend/src/utils/legacyV1ItemIdMap.js';

const DWATT_ID = '061fd221-404a-4bd1-9432-3e25b0f17a2c';
const DCARBON_ID = 'd88ef09c-9191-4c18-8628-a888bb9f926d';

describe('legacy migration semantics', () => {
  beforeEach(async () => {
    localStorage.clear();
    await resetGameState();
  });

  afterEach(async () => {
    await closeGameStateDatabaseForTesting();
    localStorage.clear();
  });

  test('readLegacyV2LocalStorage falls back to gameStateBackup when gameState is absent', () => {
    localStorage.setItem(
      'gameStateBackup',
      JSON.stringify({
        versionNumberString: '2.1',
        inventory: { 1: 2 },
        quests: { q1: { finished: true } },
        processes: {},
      })
    );

    const parsed = readLegacyV2LocalStorage();

    expect(parsed.sourceKey).toBe('gameStateBackup');
    expect(parsed.state?.inventory).toEqual({ [V1_ITEM_ID_TO_V3_UUID[1]]: 2 });
  });

  test('readLegacyV2LocalStorage prefers gameState when both gameState and backup are present', () => {
    localStorage.setItem(
      'gameState',
      JSON.stringify({
        versionNumberString: '2.1',
        inventory: { 1: 3 },
        quests: {},
        processes: {},
      })
    );
    localStorage.setItem(
      'gameStateBackup',
      JSON.stringify({
        versionNumberString: '2.1',
        inventory: { 1: 9 },
        quests: {},
        processes: {},
      })
    );

    const parsed = readLegacyV2LocalStorage();

    expect(parsed.sourceKey).toBe('gameState');
    expect(parsed.state?.inventory[V1_ITEM_ID_TO_V3_UUID[1]]).toBe(3);
  });

  test('importV2V3 migrates from backup-only legacy payloads and removes legacy keys', async () => {
    localStorage.setItem(
      'gameStateBackup',
      JSON.stringify({
        versionNumberString: '2.1',
        inventory: { 1: 4 },
        quests: { q1: { finished: true } },
        processes: {},
      })
    );

    const migrated = await importV2V3();

    expect(migrated?.versionNumberString).toBe(VERSIONS.V3);
    expect(localStorage.getItem('gameStateBackup')).toBeNull();
    expect(loadGameState().inventory[V1_ITEM_ID_TO_V3_UUID[1]]).toBe(4);
  });

  test('importV2V3 compensates in-progress v2 processes and removes those migrated entries', async () => {
    localStorage.setItem(
      'gameState',
      JSON.stringify({
        versionNumberString: '2.1',
        inventory: {},
        quests: {},
        processes: {
          'outlet-dWatt-1e3': {
            startedAt: Date.now() - 10_000,
            duration: 5_000,
          },
        },
      })
    );

    const migrated = await importV2V3();

    expect(migrated?.processes['outlet-dWatt-1e3']).toBeUndefined();
    expect(migrated?.inventory[DWATT_ID]).toBe(1000);
    expect(migrated?.inventory[DCARBON_ID]).toBe(0.98);
  });
});
