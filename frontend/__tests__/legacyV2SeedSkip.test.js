import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const originalIndexedDB = globalThis.indexedDB;

const legacyState = {
    versionNumberString: '2.1',
    inventory: {},
    quests: {},
    processes: {},
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
    const { LEGACY_V2_SEED_SKIP_KEY } = await import('../src/utils/legacySaveParsing.js');
    localStorage.setItem(LEGACY_V2_SEED_SKIP_KEY, 'true');

    await import('../src/utils/gameState.js');
    await new Promise((resolve) => setTimeout(resolve, 0));

    const stored = JSON.parse(localStorage.getItem('gameState'));
    expect(stored.versionNumberString).toBe('2.1');
    expect(localStorage.getItem(LEGACY_V2_SEED_SKIP_KEY)).toBe('true');
});
