import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { LEGACY_V2_SEED_SKIP_KEY } from '../src/utils/legacySaveParsing.js';

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

const waitForAssertion = async (assertion: () => void, timeoutMs = 2000) => {
    const started = Date.now();
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            assertion();
            return;
        } catch (error) {
            if (Date.now() - started >= timeoutMs) {
                throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, 25));
        }
    }
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

    await waitForAssertion(() => {
        const stored = getStoredGameState();
        expect(stored?.versionNumberString).toBe('3');
        expect(localStorage.getItem(LEGACY_V2_SEED_SKIP_KEY)).toBeNull();
    });
});
