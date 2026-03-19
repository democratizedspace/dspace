import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  closeGameStateDatabaseForTesting,
  loadGameState,
  resetGameState,
} from '../frontend/src/utils/gameState/common.js';
import * as gameStateCommon from '../frontend/src/utils/gameState/common.js';
import { importV2V3, VERSIONS } from '../frontend/src/utils/gameState.js';
import { LEGACY_V2_SEED_SKIP_KEY } from '../frontend/src/utils/legacySaveParsing.js';
import { readLegacyV2LocalStorage } from '../frontend/src/utils/legacySaveParsing.js';
import { V1_ITEM_ID_TO_V3_UUID } from '../frontend/src/utils/legacyV1ItemIdMap.js';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };

const OUTLET_PROCESS_ID = 'outlet-dWatt-1e3';
const BENCHY_LEGACY_PROCESS_ID = 'processes/benchy';
const outletCreateItems =
  processes.find((process) => process.id === OUTLET_PROCESS_ID)?.createItems ?? [];
const benchyCreateItems =
  processes.find((process) => process.id === '3dprint-benchy')?.createItems ?? [];
const waitForAssertion = async (assertion, timeoutMs = 1500) => {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      assertion();
      return;
    } catch (error) {
      if (Date.now() - start >= timeoutMs) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
};

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

  test('importV2V3 runs once per legacy source by deleting legacy keys after success', async () => {
    localStorage.setItem(
      'gameState',
      JSON.stringify({
        versionNumberString: '2.1',
        inventory: { 1: 4 },
        quests: {},
        processes: {},
      })
    );

    const firstMigration = await importV2V3();
    const secondMigration = await importV2V3();

    expect(firstMigration?.versionNumberString).toBe(VERSIONS.V3);
    expect(secondMigration).toBeNull();
    expect(localStorage.getItem('gameState')).toBeNull();
    expect(localStorage.getItem('gameStateBackup')).toBeNull();
  });

  test('importV2V3 keeps legacy keys when the v3 write callback reports a failure (throws)', async () => {
    localStorage.setItem(
      'gameState',
      JSON.stringify({
        versionNumberString: '2.1',
        inventory: { 1: 4 },
        quests: {},
        processes: {},
      })
    );

    const saveSpy = vi
      .spyOn(gameStateCommon, 'saveGameState')
      .mockRejectedValueOnce(new Error('simulated write callback failure'));

    await expect(importV2V3()).rejects.toThrow('simulated write callback failure');
    expect(localStorage.getItem('gameState')).not.toBeNull();

    saveSpy.mockRestore();
  });

  test('importV2V3 keeps backup-only legacy keys when the v3 write callback reports a failure (throws)', async () => {
    localStorage.setItem(
      'gameStateBackup',
      JSON.stringify({
        versionNumberString: '2.1',
        inventory: { 1: 4 },
        quests: {},
        processes: {},
      })
    );

    const saveSpy = vi
      .spyOn(gameStateCommon, 'saveGameState')
      .mockRejectedValueOnce(new Error('simulated write callback failure'));

    await expect(importV2V3()).rejects.toThrow('simulated write callback failure');
    const backupAfterFailure = localStorage.getItem('gameStateBackup');
    expect(backupAfterFailure).not.toBeNull();
    expect(JSON.parse(backupAfterFailure).versionNumberString).toBe('2.1');

    saveSpy.mockRestore();
  });

  test('importV2V3 compensates in-progress v2 processes and removes those migrated entries', async () => {
    localStorage.setItem(
      'gameState',
      JSON.stringify({
        versionNumberString: '2.1',
        inventory: {},
        quests: {},
        processes: {
          [OUTLET_PROCESS_ID]: {
            startedAt: Date.now() - 10_000,
            duration: 5_000,
          },
        },
      })
    );

    const migrated = await importV2V3();

    expect(migrated?.processes[OUTLET_PROCESS_ID]).toBeUndefined();
    outletCreateItems.forEach(({ id, count }) => {
      expect(migrated?.inventory[id]).toBe(count);
    });
  });

  test('importV2V3 compensates legacy process IDs and removes unresolved in-progress entries', async () => {
    localStorage.setItem(
      'gameState',
      JSON.stringify({
        versionNumberString: '2.1',
        inventory: {},
        quests: {},
        processes: {
          [BENCHY_LEGACY_PROCESS_ID]: {
            startedAt: Date.now() - 10_000,
            duration: 5_000,
          },
          'processes/no-longer-exists': {
            startedAt: Date.now() - 10_000,
            duration: 5_000,
          },
        },
      })
    );

    const migrated = await importV2V3();

    expect(migrated?.processes[BENCHY_LEGACY_PROCESS_ID]).toBeUndefined();
    expect(migrated?.processes['processes/no-longer-exists']).toBeUndefined();
    benchyCreateItems.forEach(({ id, count }) => {
      expect(migrated?.inventory[id]).toBe(count);
    });
  });

  test('first-load bootstrap auto-migrates when only gameStateBackup is present', async () => {
    localStorage.setItem(
      'gameStateBackup',
      JSON.stringify({
        versionNumberString: '2.1',
        inventory: { 1: 7 },
        quests: {},
        processes: {},
      })
    );

    vi.resetModules();
    await import('../frontend/src/utils/gameState.js');
    const { loadGameState: loadReloadedState } = await import(
      '../frontend/src/utils/gameState/common.js'
    );

    await waitForAssertion(() => {
      expect(localStorage.getItem('gameState')).toBeNull();
      expect(localStorage.getItem('gameStateBackup')).toBeNull();
      expect(loadReloadedState().inventory[V1_ITEM_ID_TO_V3_UUID[1]]).toBe(7);
    });
  });

  test('first-load bootstrap skip key suppresses backup-only auto-migration', async () => {
    localStorage.setItem(
      'gameStateBackup',
      JSON.stringify({
        versionNumberString: '2.1',
        inventory: { 1: 11 },
        quests: {},
        processes: {},
      })
    );
    localStorage.setItem(LEGACY_V2_SEED_SKIP_KEY, '1');

    vi.resetModules();
    await import('../frontend/src/utils/gameState.js');
    const { loadGameState: loadReloadedState } = await import(
      '../frontend/src/utils/gameState/common.js'
    );

    await waitForAssertion(() => {
      expect(localStorage.getItem('gameStateBackup')).not.toBeNull();
      expect(loadReloadedState().inventory[V1_ITEM_ID_TO_V3_UUID[1]] ?? 0).toBe(0);
    });
  });
});
