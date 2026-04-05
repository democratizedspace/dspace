import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from 'svelte';
import Quests from '../src/pages/quests/svelte/Quests.svelte';

const {
    stateStoreMock,
    loadGameStateMock,
    getPersistedGameStateLightweightSyncMock,
    getAuthoritativeQuestProgressSnapshotMock,
} = vi.hoisted(() => {
    const subscribers = new Set();
    let storeValue = { settings: { showQuestGraphVisualizer: false }, quests: {} };

    const stateStore = {
        subscribe(run) {
            run(storeValue);
            subscribers.add(run);
            return () => subscribers.delete(run);
        },
        set(nextValue) {
            storeValue = nextValue;
            subscribers.forEach((run) => run(storeValue));
        },
    };

    return {
        stateStoreMock: stateStore,
        loadGameStateMock: vi.fn(() => ({ settings: { showQuestGraphVisualizer: false }, quests: {} })),
        getPersistedGameStateLightweightSyncMock: vi.fn(() => ({
            checksum: 'snapshot-1',
            questProgress: { version: 1, completedQuestIds: [] },
        })),
        getAuthoritativeQuestProgressSnapshotMock: vi.fn(() => ({
            authoritative: false,
            completedQuestIds: [],
        })),
    };
});

vi.mock('../src/utils/customcontent.js', () => ({
    listCustomQuests: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/utils/gameState/common.js', () => ({
    state: stateStoreMock,
    loadGameState: loadGameStateMock,
    ready: Promise.resolve(),
    getPersistedGameStateLightweightSync: getPersistedGameStateLightweightSyncMock,
    getAuthoritativeQuestProgressSnapshot: getAuthoritativeQuestProgressSnapshotMock,
}));

describe('Quests Component', () => {
    const quests = [
        {
            id: 'welcome/test-available',
            title: 'Available Quest',
            description: 'This quest is available',
            image: '/available.jpg',
            requiresQuests: [],
            route: '/quests/welcome/test-available',
        },
        {
            id: 'welcome/test-locked',
            title: 'Locked Quest',
            description: 'This quest is locked',
            image: '/locked.jpg',
            requiresQuests: ['welcome/missing-prereq'],
            route: '/quests/welcome/test-locked',
        },
        {
            id: 'welcome/test-completed',
            title: 'Completed Quest',
            description: 'This quest is completed',
            image: '/completed.jpg',
            requiresQuests: [],
            route: '/quests/welcome/test-completed',
        },
    ];

    let host;

    beforeEach(() => {
        host = document.createElement('div');
        document.body.appendChild(host);

        getAuthoritativeQuestProgressSnapshotMock.mockReturnValue({
            authoritative: true,
            completedQuestIds: ['welcome/test-completed'],
        });

        loadGameStateMock.mockReturnValue({
            settings: { showQuestGraphVisualizer: false },
            quests: {
                'welcome/test-completed': { finished: true },
            },
        });
    });

    afterEach(() => {
        document.body.removeChild(host);
        vi.clearAllMocks();
    });

    it('renders only available built-in quests in the main grid and keeps completed in completed section', async () => {
        mount(Quests, { target: host, props: { quests } });
        await Promise.resolve();

        const mainGrid = host.querySelector('[data-testid="quests-grid"]');
        expect(mainGrid.textContent).toContain('Available Quest');
        expect(mainGrid.textContent).not.toContain('Locked Quest');
        expect(mainGrid.textContent).not.toContain('Completed Quest');

        expect(host.textContent).toContain('Completed Quests');
        expect(host.textContent).toContain('Completed Quest');
    });

    it('does not render unknown quests in the main built-in list before authoritative data exists', () => {
        getAuthoritativeQuestProgressSnapshotMock.mockReturnValue({
            authoritative: false,
            completedQuestIds: [],
        });

        loadGameStateMock.mockImplementation(() => {
            throw new Error('full state not ready yet');
        });
        mount(Quests, { target: host, props: { quests } });

        const mainGrid = host.querySelector('[data-testid="quests-grid"]');
        expect(mainGrid.textContent).not.toContain('Available Quest');
        expect(mainGrid.textContent).not.toContain('Locked Quest');
        expect(mainGrid.textContent).not.toContain('Completed Quest');

        const statuses = Array.from(host.querySelectorAll("[data-testid='quest-status-slot']")).map(
            (n) => n.textContent.trim()
        );
        expect(statuses).toEqual([]);
    });
});
