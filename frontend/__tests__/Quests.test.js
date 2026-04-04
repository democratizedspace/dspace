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
        authoritative: false,
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

    it('renders meaningful built-in quest content immediately', () => {
        mount(Quests, { target: host, props: { quests } });
        expect(host.textContent).toContain('Test Quest 1');
        expect(host.textContent).toContain('Test Quest 2');
    });

    it('renders neutral status when authoritative data is unavailable', () => {
        mount(Quests, { target: host, props: { quests } });
        const statuses = Array.from(host.querySelectorAll("[data-testid='quest-status-slot']")).map(
            (n) => n.textContent.trim()
        );
        expect(statuses).toContain('Checking');
        expect(statuses).not.toContain('Start');
    });
});
