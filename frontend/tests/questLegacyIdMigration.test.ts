import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const originalIndexedDB = globalThis.indexedDB;

beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    // @ts-expect-error - force localStorage game-state path
    delete globalThis.indexedDB;
});

test('questFinished migrates legacy 3dprinter/start completion into 3dprinting/start', async () => {
    localStorage.setItem(
        'gameState',
        JSON.stringify({
            versionNumberString: '3',
            inventory: {},
            quests: {
                '3dprinter/start': {
                    finished: true,
                    itemsClaimed: ['3dprinter/start-1-0'],
                },
            },
            processes: {},
        })
    );

    const { questFinished } = await import('../src/utils/gameState.js');

    expect(questFinished('3dprinting/start')).toBe(true);

    const stored = JSON.parse(localStorage.getItem('gameState') || '{}');
    expect(stored.quests['3dprinter/start']).toBeUndefined();
    expect(stored.quests['3dprinting/start']?.finished).toBe(true);
    expect(stored.quests['3dprinting/start']?.itemsClaimed).toContain('3dprinter/start-1-0');
});

test('finishQuest writes completion state to canonical quest id', async () => {
    localStorage.setItem(
        'gameState',
        JSON.stringify({
            versionNumberString: '3',
            inventory: {},
            quests: {
                '3dprinter/start': {
                    finished: true,
                },
            },
            processes: {},
        })
    );

    const { finishQuest } = await import('../src/utils/gameState.js');

    finishQuest('3dprinter/start', []);

    const stored = JSON.parse(localStorage.getItem('gameState') || '{}');
    expect(stored.quests['3dprinter/start']).toBeUndefined();
    expect(stored.quests['3dprinting/start']?.finished).toBe(true);
});

afterEach(() => {
    globalThis.indexedDB = originalIndexedDB;
});
