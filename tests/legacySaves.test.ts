import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
    LEGACY_LOCAL_STORAGE_KEYS,
    applyItemsToState,
    clearLegacyLocalStorage,
    hasGameProgress,
    mergeGameStates,
    normalizeStateVersion,
    readLegacyLocalStorageState,
} from '../frontend/src/utils/legacySaves.js';

describe('legacySaves helpers', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    test('hasGameProgress detects content across quests, inventory, and processes', () => {
        expect(hasGameProgress(null)).toBe(false);
        expect(hasGameProgress({ quests: { a: {} } })).toBe(true);
        expect(hasGameProgress({ inventory: { a: 0 } })).toBe(false);
        expect(hasGameProgress({ inventory: { a: 2 } })).toBe(true);
        expect(hasGameProgress({ processes: { p1: { step: 1 } } })).toBe(true);
    });

    test('mergeGameStates merges quests, inventory, and processes safely', () => {
        const current = {
            quests: { q1: { finished: true, itemsClaimed: ['a'] } },
            inventory: { i1: 1 },
            processes: { p1: { progress: 10 } },
            _meta: { lastUpdated: 1 },
        };
        const incoming = {
            quests: { q1: { stepId: 2, itemsClaimed: ['b'] }, q2: { finished: true } },
            inventory: { i1: 5, i2: 2 },
            processes: { p1: { progress: 20 }, p2: { progress: 5 } },
            _meta: { lastUpdated: 2 },
        };

        const merged = mergeGameStates(current, incoming);

        expect(merged.quests.q1.finished).toBe(true);
        expect(merged.quests.q1.stepId).toBe(2);
        expect(new Set(merged.quests.q1.itemsClaimed)).toEqual(new Set(['a', 'b']));
        expect(merged.quests.q2.finished).toBe(true);
        expect(merged.inventory).toEqual({ i1: 5, i2: 2 });
        expect(merged.processes).toEqual({
            p1: { progress: 20 },
            p2: { progress: 5 },
        });
        expect(merged._meta.lastUpdated).toBeGreaterThanOrEqual(2);
    });

    test('applyItemsToState adds counts and version', () => {
        const state = { inventory: { i1: 1 } };
        const items = [
            { id: 'i1', count: 2 },
            { id: 'i2', count: 4 },
        ];

        const next = applyItemsToState({ baseState: state, items, versionNumber: '3' });
        expect(next.inventory).toEqual({ i1: 3, i2: 4 });
        expect(next.versionNumberString).toBe('3');
        expect(next._meta.lastUpdated).toBeDefined();
    });

    test('normalizeStateVersion sets version and meta timestamp', () => {
        const normalized = normalizeStateVersion({ quests: {} }, '3');
        expect(normalized.versionNumberString).toBe('3');
        expect(normalized._meta.lastUpdated).toBeGreaterThan(0);
    });

    test('readLegacyLocalStorageState handles missing or malformed JSON', () => {
        const getItem = vi.fn(() => null);
        expect(readLegacyLocalStorageState({ getItem })).toEqual({ state: null, error: null });

        const badStorage = { getItem: vi.fn(() => '{bad json') };
        const result = readLegacyLocalStorageState(badStorage);
        expect(result.state).toBeNull();
        expect(result.error).toBeInstanceOf(Error);

        const goodStorage = { getItem: vi.fn(() => '{"foo":"bar"}') };
        expect(readLegacyLocalStorageState(goodStorage)).toEqual({
            state: { foo: 'bar' },
            error: null,
        });
    });

    test('clearLegacyLocalStorage removes legacy keys', () => {
        const removeItem = vi.fn();
        clearLegacyLocalStorage({ removeItem });
        LEGACY_LOCAL_STORAGE_KEYS.forEach((key) => {
            expect(removeItem).toHaveBeenCalledWith(key);
        });
    });
});
