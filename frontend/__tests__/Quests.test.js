import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from 'svelte';
import { writable } from 'svelte/store';
import Quests from '../src/pages/quests/svelte/Quests.svelte';
import { classifyQuestList } from '../src/utils/quests/listClassifier.js';

vi.mock('../src/utils/customcontent.js', () => ({
    listCustomQuests: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/utils/gameState/common.js', () => ({
    state: writable({ settings: { showQuestGraphVisualizer: false }, quests: {} }),
    loadGameState: vi.fn(() => ({ settings: { showQuestGraphVisualizer: false }, quests: {} })),
    ready: Promise.resolve(),
    getPersistedGameStateLightweightSync: vi.fn(() => ({
        checksum: 'snapshot-1',
        questProgress: { version: 1, completedQuestIds: [] },
    })),
    getAuthoritativeQuestProgressSnapshot: vi.fn(() => ({
        authoritative: false,
        completedQuestIds: [],
    })),
}));

vi.mock('../src/utils/quests/listClassifier.js', () => ({
    classifyQuestList: vi.fn(),
}));

describe('Quests Component', () => {
    const quests = [
        {
            id: 'welcome/test1',
            title: 'Test Quest 1',
            description: 'This is a test quest',
            image: '/test1.jpg',
            requiresQuests: [],
            route: '/quests/welcome/test1',
        },
        {
            id: 'welcome/test2',
            title: 'Test Quest 2',
            description: 'This is another test quest',
            image: '/test2.jpg',
            requiresQuests: ['welcome/test1'],
            route: '/quests/welcome/test2',
        },
        {
            id: 'welcome/test3',
            title: 'Test Quest 3',
            description: 'This is a completed quest',
            image: '/test3.jpg',
            requiresQuests: [],
            route: '/quests/welcome/test3',
        },
    ];

    let host;

    beforeEach(() => {
        host = document.createElement('div');
        document.body.appendChild(host);
    });

    afterEach(() => {
        document.body.removeChild(host);
        vi.clearAllMocks();
    });

    it('renders only available quests in the main built-in grid', () => {
        classifyQuestList.mockImplementation(({ quests: classifiedQuests = [] }) =>
            classifiedQuests.map((quest, index) => {
                const statuses = ['available', 'locked', 'completed', 'unknown'];
                return { ...quest, status: statuses[index] ?? 'unknown' };
            })
        );

        mount(Quests, { target: host, props: { quests } });

        const builtInGrid = host.querySelector("[data-testid='quests-grid']");
        expect(builtInGrid.textContent).toContain('Test Quest 1');
        expect(builtInGrid.textContent).not.toContain('Test Quest 2');

        expect(host.textContent).toContain('Completed Quests');
        expect(host.textContent).toContain('Test Quest 3');
    });

    it('keeps locked and unknown quests out of the main built-in grid', () => {
        classifyQuestList.mockReturnValue([
            { ...quests[0], status: 'locked' },
            { ...quests[1], status: 'unknown' },
        ]);

        mount(Quests, { target: host, props: { quests } });

        const builtInGrid = host.querySelector("[data-testid='quests-grid']");
        expect(builtInGrid.textContent).not.toContain('Test Quest 1');
        expect(builtInGrid.textContent).not.toContain('Test Quest 2');
    });

    it('does not render unknown quests in the actionable grid when authoritative data is unavailable', () => {
        classifyQuestList.mockReturnValue([{ ...quests[0], status: 'unknown' }]);
        mount(Quests, { target: host, props: { quests } });
        const builtInGrid = host.querySelector("[data-testid='quests-grid']");
        expect(builtInGrid.textContent).not.toContain('Test Quest 1');
        const statuses = Array.from(host.querySelectorAll("[data-testid='quest-status-slot']"));
        expect(statuses).toHaveLength(0);
    });
});
