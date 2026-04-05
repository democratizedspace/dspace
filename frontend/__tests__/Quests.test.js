import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from 'svelte';
import { writable } from 'svelte/store';
import Quests from '../src/pages/quests/svelte/Quests.svelte';

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
        authoritative: true,
        completedQuestIds: [],
    })),
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

    const flushPromises = async () => {
        await Promise.resolve();
        await Promise.resolve();
    };

    it('renders only available built-in quests in the main list', async () => {
        const gameStateModule = await import('../src/utils/gameState/common.js');
        gameStateModule.getAuthoritativeQuestProgressSnapshot.mockReturnValue({
            authoritative: true,
            completedQuestIds: [],
        });

        mount(Quests, { target: host, props: { quests } });
        await flushPromises();
        expect(host.textContent).toContain('Test Quest 1');
        expect(host.textContent).not.toContain('Test Quest 2');
    });

    it('keeps locked and unknown built-in quests out of the main list', async () => {
        const gameStateModule = await import('../src/utils/gameState/common.js');
        gameStateModule.getAuthoritativeQuestProgressSnapshot.mockReturnValue({
            authoritative: false,
            completedQuestIds: [],
        });

        mount(Quests, { target: host, props: { quests } });
        await flushPromises();

        const mainStatuses = Array.from(
            host.querySelectorAll(
                "[data-testid='quests-grid'] [data-testid='quest-status-slot']"
            )
        ).map((n) => n.textContent.trim());
        expect(mainStatuses).toEqual([]);
        expect(mainStatuses).not.toContain('Locked');
        expect(mainStatuses).not.toContain('Checking');
    });

    it('renders completed built-in quests in the completed section', async () => {
        const gameStateModule = await import('../src/utils/gameState/common.js');
        gameStateModule.getAuthoritativeQuestProgressSnapshot.mockReturnValue({
            authoritative: true,
            completedQuestIds: ['welcome/test1'],
        });

        mount(Quests, { target: host, props: { quests } });
        await flushPromises();

        expect(host.textContent).toContain('Completed Quests');
        const completedStatuses = Array.from(
            host.querySelectorAll(
                "h2 + a [data-testid='quest-status-slot'], h2 ~ a [data-testid='quest-status-slot']"
            )
        ).map((n) => n.textContent.trim());
        expect(completedStatuses).toContain('Completed');
    });
});
