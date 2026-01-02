import 'fake-indexeddb/auto';
import { describe, expect, test, beforeEach, afterEach } from 'vitest';

import {
    closeGameStateDatabaseForTesting,
    loadGameState,
    resetGameState,
    saveGameState,
} from '../src/utils/gameState/common.js';
import {
    importV1V3,
    importV2V3,
    mergeLegacyStateIntoCurrent,
    VERSIONS,
} from '../src/utils/gameState.js';

beforeEach(async () => {
    localStorage.clear();
    await resetGameState();
});

afterEach(async () => {
    await closeGameStateDatabaseForTesting();
    localStorage.clear();
});

describe('game state upgrades', () => {
    test('importV2V3 migrates legacy localStorage data and stamps version', async () => {
        localStorage.setItem(
            'gameState',
            JSON.stringify({
                inventory: { 1: 3 },
                quests: { q1: { finished: true } },
            })
        );

        const migrated = await importV2V3();

        expect(migrated.versionNumberString).toBe(VERSIONS.V3);
        const state = loadGameState();
        expect(state.inventory['1']).toBe(3);
        expect(state.quests.q1.finished).toBe(true);
        expect(localStorage.getItem('gameState')).toContain(
            `"versionNumberString":"${VERSIONS.V3}"`
        );
    });

    test('mergeLegacyStateIntoCurrent preserves progress and merges missing fields', async () => {
        await saveGameState({
            inventory: { alpha: 1 },
            quests: { current: { finished: true } },
            processes: { active: { progress: 50 } },
            _meta: { lastUpdated: Date.now() },
        });

        const merged = await mergeLegacyStateIntoCurrent({
            inventory: { alpha: 2, beta: 1 },
            quests: { legacy: { finished: true }, current: { finished: false } },
            processes: { extra: { status: 'running' } },
        });

        expect(merged.versionNumberString).toBe(VERSIONS.V3);
        const state = loadGameState();
        expect(state.inventory.alpha).toBe(3);
        expect(state.inventory.beta).toBe(1);
        expect(state.quests.current.finished).toBe(true);
        expect(state.quests.legacy.finished).toBe(true);
        expect(state.processes.active.progress).toBe(50);
        expect(state.processes.extra.status).toBe('running');
    });

    test('importV1V3 can replace existing state with converted items', async () => {
        await saveGameState({
            inventory: { stale: 9 },
            quests: { keep: { finished: true } },
            processes: {},
            _meta: { lastUpdated: Date.now() },
        });

        const migrated = await importV1V3(
            [
                { id: 'item-1', count: 2 },
                { id: 'item-2', count: 0 },
            ],
            { replaceExisting: true }
        );

        expect(migrated.versionNumberString).toBe(VERSIONS.V3);
        const state = loadGameState();
        expect(state.inventory['item-1']).toBe(2);
        expect(state.inventory.stale || 0).toBe(0);
        expect(state.quests.keep).toBeUndefined();
    });
});
