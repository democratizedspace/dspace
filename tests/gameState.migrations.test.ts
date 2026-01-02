import {
    determineStateVersion,
    stateHasContent,
    normalizeToV3State,
    mergeGameStates,
    buildV1InventoryState,
} from '../frontend/src/utils/gameState/migrations.js';
import { VERSIONS } from '../frontend/src/utils/gameState.js';
import items from '../frontend/src/pages/inventory/json/items';

const EARLY_ADOPTER_ID = items.find((item) => item.name === 'Early Adopter Token')?.id;

describe('gameState migrations helpers', () => {
    it('determines version from versionNumberString and meta', () => {
        expect(determineStateVersion({ versionNumberString: VERSIONS.V1 })).toBe('v1');
        expect(determineStateVersion({ versionNumberString: VERSIONS.V2 })).toBe('v2');
        expect(determineStateVersion({ versionNumberString: VERSIONS.V3 })).toBe('v3');
        expect(determineStateVersion({ _meta: {} })).toBe('v3');
        expect(determineStateVersion({})).toBe('v2');
    });

    it('detects whether a state has meaningful content', () => {
        expect(stateHasContent(null)).toBe(false);
        expect(stateHasContent({ quests: { a: {} } })).toBe(true);
        expect(stateHasContent({ inventory: { '1': 0 } })).toBe(false);
        expect(stateHasContent({ inventory: { '1': 2 } })).toBe(true);
        expect(stateHasContent({ processes: { x: 1 } })).toBe(true);
    });

    it('normalizes states to v3 shape and version', () => {
        const normalized = normalizeToV3State({ quests: { q: {} }, inventory: {} });
        expect(normalized.versionNumberString).toBe(VERSIONS.V3);
        expect(normalized.quests).toHaveProperty('q');
        expect(normalized).toHaveProperty('_meta');
        expect(typeof normalized._meta?.lastUpdated).toBe('number');
    });

    it('merges legacy and current game states', () => {
        const current = {
            quests: { quest1: { finished: true, itemsClaimed: ['a'], stepId: 2 } },
            inventory: { '10': 1 },
            processes: { foo: 1 },
            versionNumberString: VERSIONS.V3,
        };
        const legacy = {
            quests: { quest1: { finished: false, itemsClaimed: ['b'], stepId: 3 } },
            inventory: { '10': 2, '20': 1 },
            processes: { foo: 5, bar: 2 },
            versionNumberString: VERSIONS.V2,
        };

        const merged = mergeGameStates(current, legacy);
        expect(merged.inventory['10']).toBe(3);
        expect(merged.inventory['20']).toBe(1);
        expect(merged.quests.quest1.finished).toBe(true);
        expect(merged.quests.quest1.stepId).toBe(3);
        expect(merged.quests.quest1.itemsClaimed.sort()).toEqual(['a', 'b']);
        expect(merged.processes.foo).toBe(5);
        expect(merged.processes.bar).toBe(2);
        expect(merged.versionNumberString).toBe(VERSIONS.V3);
    });

    it('builds v1 inventory state with early adopter token', () => {
        const state = buildV1InventoryState([
            { id: '5', count: 2 },
            { id: '5', count: 3 },
        ]);

        expect(state.versionNumberString).toBe(VERSIONS.V3);
        expect(state.inventory['5']).toBe(5);
        if (EARLY_ADOPTER_ID) {
            expect(state.inventory[EARLY_ADOPTER_ID]).toBeGreaterThanOrEqual(1);
        }
    });
});
