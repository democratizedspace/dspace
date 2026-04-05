import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from 'svelte';
import Quests from '../src/pages/quests/svelte/Quests.svelte';

const gameStateMocks = vi.hoisted(() => {
    const storeState = {
        settings: { showQuestGraphVisualizer: false },
        quests: { 'welcome/completed': { finished: true } },
    };
    return {
        mockStateStore: {
            subscribe(run) {
                run(storeState);
                return () => {};
            },
        },
        mockLoadGameState: vi.fn(() => storeState),
        mockGetPersistedGameStateLightweightSync: vi.fn(() => ({
            checksum: 'snapshot-1',
            questProgress: { version: 1, completedQuestIds: [] },
        })),
        mockGetAuthoritativeQuestProgressSnapshot: vi.fn(() => ({
            authoritative: true,
            completedQuestIds: ['welcome/completed'],
        })),
    };
});

vi.mock('../src/utils/customcontent.js', () => ({
    listCustomQuests: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/utils/gameState/common.js', () => ({
    state: gameStateMocks.mockStateStore,
    loadGameState: gameStateMocks.mockLoadGameState,
    ready: Promise.resolve(),
    getPersistedGameStateLightweightSync: gameStateMocks.mockGetPersistedGameStateLightweightSync,
    getAuthoritativeQuestProgressSnapshot: gameStateMocks.mockGetAuthoritativeQuestProgressSnapshot,
}));

describe('Quests Component', () => {
    const quests = [
        {
            id: 'welcome/available',
            title: 'Available Quest',
            description: 'This quest should be visible in the main grid.',
            image: '/available.jpg',
            requiresQuests: [],
            route: '/quests/welcome/available',
        },
        {
            id: 'welcome/locked',
            title: 'Locked Quest',
            description: 'This quest should be hidden from the main grid.',
            image: '/locked.jpg',
            requiresQuests: ['welcome/missing'],
            route: '/quests/welcome/locked',
        },
        {
            id: 'welcome/completed',
            title: 'Completed Quest',
            description: 'This quest should appear in the completed section.',
            image: '/completed.jpg',
            requiresQuests: [],
            route: '/quests/welcome/completed',
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

    it('renders only available built-in quests in the actionable grid', async () => {
        mount(Quests, { target: host, props: { quests } });
        await new Promise((resolve) => setTimeout(resolve, 0));

        const builtInLinks = Array.from(
            host.querySelectorAll(".quests-grid[data-testid='quests-grid'] a")
        );
        expect(builtInLinks).toHaveLength(1);
        expect(host.textContent).toContain('Available Quest');
        expect(host.textContent).not.toContain('Locked Quest');
    });

    it('keeps completed quests in the completed section and out of the main grid', async () => {
        mount(Quests, { target: host, props: { quests } });
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(host.textContent).toContain('Completed Quests');
        expect(host.textContent).toContain('Completed Quest');

        const builtInGridText =
            host.querySelector(".quests-grid[data-testid='quests-grid']")?.textContent || '';
        expect(builtInGridText).not.toContain('Completed Quest');
    });

    it('does not render unknown quests in the actionable grid before authoritative data', () => {
        gameStateMocks.mockGetAuthoritativeQuestProgressSnapshot.mockReturnValueOnce({
            authoritative: false,
            completedQuestIds: [],
        });

        mount(Quests, { target: host, props: { quests } });

        const builtInLinks = Array.from(
            host.querySelectorAll(".quests-grid[data-testid='quests-grid'] a")
        );
        expect(builtInLinks).toHaveLength(0);
    });
});
