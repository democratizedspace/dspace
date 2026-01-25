import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { LEGACY_V2_SEED_SKIP_KEY } from '../src/utils/legacySaveParsing.js';
import { clearV3GameStateStorage } from '../src/utils/legacySaveSeeding';

const originalIndexedDB = globalThis.indexedDB;

const legacyState = {
    versionNumberString: '2.1',
    inventory: {},
    quests: {},
    processes: {},
};

const getStoredGameState = () => {
    const raw = localStorage.getItem('gameState');
    return raw ? JSON.parse(raw) : null;
};

beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    // @ts-expect-error: deliberately remove IndexedDB for deterministic localStorage behavior
    delete globalThis.indexedDB;
});

afterEach(() => {
    globalThis.indexedDB = originalIndexedDB;
});

test('auto-migration skips when QA seed flag is present', async () => {
    localStorage.setItem('gameState', JSON.stringify(legacyState));
    localStorage.setItem(LEGACY_V2_SEED_SKIP_KEY, 'true');

    await import('../src/utils/gameState.js');

    const stored = getStoredGameState();
    expect(stored?.versionNumberString).toBe('2.1');
    expect(localStorage.getItem(LEGACY_V2_SEED_SKIP_KEY)).toBe('true');
});

test('auto-migration runs when QA seed flag is absent', async () => {
    localStorage.setItem('gameState', JSON.stringify(legacyState));

    await import('../src/utils/gameState.js');
    const { ready } = await import('../src/utils/gameState/common.js');
    await ready;
    await Promise.resolve();

    const stored = getStoredGameState();
    expect(stored?.versionNumberString).toBe('3');
    expect(localStorage.getItem(LEGACY_V2_SEED_SKIP_KEY)).toBeNull();
});

test('clear v3 preserves legacy v2 data and seed flag when a backup remains', async () => {
    const v3State = {
        versionNumberString: '3.0',
        inventory: {},
        quests: {},
        processes: {},
    };

    localStorage.setItem('gameState', JSON.stringify(v3State));
    localStorage.setItem('gameStateBackup', JSON.stringify(legacyState));
    localStorage.setItem(LEGACY_V2_SEED_SKIP_KEY, 'true');

    await clearV3GameStateStorage();

    expect(localStorage.getItem('gameState')).toBeNull();
    expect(localStorage.getItem('gameStateBackup')).toBe(JSON.stringify(legacyState));
    expect(localStorage.getItem(LEGACY_V2_SEED_SKIP_KEY)).toBe('true');
});
