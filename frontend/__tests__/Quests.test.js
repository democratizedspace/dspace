import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, unmount } from 'svelte';
import { writable } from 'svelte/store';
import Quests from '../src/pages/quests/svelte/Quests.svelte';
import { classifyQuestList } from '../src/utils/quests/listClassifier.js';
import { listCustomQuests } from '../src/utils/customcontent.js';

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
    let mountedComponent;

    beforeEach(() => {
        mountedComponent = null;
        host = document.createElement('div');
        document.body.appendChild(host);
    });

    afterEach(() => {
        if (mountedComponent) {
            unmount(mountedComponent);
            mountedComponent = null;
        }
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

        mountedComponent = mount(Quests, { target: host, props: { quests } });

        const builtInGrid = host.querySelector("[data-testid='quests-grid']");
        expect(builtInGrid.textContent).toContain('Test Quest 1');
        expect(builtInGrid.textContent).not.toContain('Test Quest 2');
        expect(builtInGrid.textContent).not.toContain('Test Quest 3');

        expect(host.textContent).toContain('Completed Quests');
        expect(host.textContent).toContain('Test Quest 3');
        const availableQuestTile = host.querySelector(
            "a[data-questid='welcome/test1'] [data-testid='quest-tile']"
        );
        expect(availableQuestTile).not.toBeNull();
        expect(availableQuestTile?.querySelector("[data-testid='quest-status-slot']")).toBeNull();

        const completedQuestTile = host.querySelector(
            "a[data-questid='welcome/test3'] [data-testid='quest-tile']"
        );
        expect(completedQuestTile?.querySelector('.content.compact-content')).not.toBeNull();
        expect(completedQuestTile?.querySelector('.quest-img-shell.compact-shell')).not.toBeNull();
        expect(completedQuestTile?.querySelector('.quest-img-compact')).not.toBeNull();

        const completedStatusSlot = completedQuestTile?.querySelector(
            "[data-testid='quest-status-slot']"
        );
        expect(completedStatusSlot).toBeNull();
    });

    it('keeps locked and unknown quests out of the main built-in grid', () => {
        classifyQuestList.mockImplementation(({ quests: classifiedQuests = [] }) =>
            classifiedQuests.map((quest, index) => ({
                ...quest,
                status: index === 0 ? 'locked' : 'unknown',
            }))
        );

        mountedComponent = mount(Quests, { target: host, props: { quests } });

        const builtInGrid = host.querySelector("[data-testid='quests-grid']");
        expect(builtInGrid.textContent).not.toContain('Test Quest 1');
        expect(builtInGrid.textContent).not.toContain('Test Quest 2');
    });

    it('does not render unknown quests in the actionable grid when authoritative data is unavailable', () => {
        classifyQuestList.mockImplementation(({ quests: classifiedQuests = [] }) =>
            classifiedQuests.length === 0 ? [] : [{ ...classifiedQuests[0], status: 'unknown' }]
        );
        mountedComponent = mount(Quests, { target: host, props: { quests } });
        const builtInGrid = host.querySelector("[data-testid='quests-grid']");
        expect(builtInGrid.textContent).not.toContain('Test Quest 1');
        const statuses = Array.from(
            builtInGrid.querySelectorAll("[data-testid='quest-status-slot']")
        );
        expect(statuses).toHaveLength(0);
    });

    it('does not render the Custom Quests header when there are no custom quests', async () => {
        vi.useFakeTimers();
        classifyQuestList.mockImplementation(({ quests: classifiedQuests = [] }) =>
            classifiedQuests.map((quest) => ({ ...quest, status: 'available' }))
        );
        listCustomQuests.mockResolvedValueOnce([]);

        try {
            mountedComponent = mount(Quests, { target: host, props: { quests } });
            await vi.runAllTimersAsync();
            await vi.waitFor(() => expect(listCustomQuests).toHaveBeenCalled());

            expect(host.textContent).not.toContain('Custom Quests');
            expect(host.querySelector("[data-testid='custom-quests-section']")).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });

    it('falls back to safe internal quest routes for custom quests with unsafe hrefs', async () => {
        vi.useFakeTimers();
        classifyQuestList.mockImplementation(({ quests: classifiedQuests = [] }) =>
            classifiedQuests.map((quest) => ({ ...quest, status: 'available' }))
        );
        listCustomQuests.mockResolvedValueOnce([
            {
                id: 'custom/unsafe',
                title: 'Unsafe Route Quest',
                route: 'javascript:alert(1)',
                custom: true,
            },
            {
                id: 'custom/external',
                title: 'External Route Quest',
                route: '//evil.example/phish',
                custom: true,
            },
            {
                id: 'custom/backslash',
                title: 'Backslash Route Quest',
                route: '/\\evil.example/phish',
                custom: true,
            },
        ]);

        try {
            mountedComponent = mount(Quests, { target: host, props: { quests } });
            await vi.runAllTimersAsync();
            await vi.waitFor(() => expect(listCustomQuests).toHaveBeenCalled());
            await vi.waitFor(() =>
                expect(host.querySelector("a[data-questid='custom/unsafe']")).not.toBeNull()
            );

            const unsafeQuestLink = host.querySelector("a[data-questid='custom/unsafe']");
            expect(unsafeQuestLink?.getAttribute('href')).toBe('/quests/custom/unsafe');

            const externalQuestLink = host.querySelector("a[data-questid='custom/external']");
            expect(externalQuestLink?.getAttribute('href')).toBe('/quests/custom/external');

            const backslashQuestLink = host.querySelector("a[data-questid='custom/backslash']");
            expect(backslashQuestLink?.getAttribute('href')).toBe('/quests/custom/backslash');
        } finally {
            vi.useRealTimers();
        }
    });

    it('hides locked custom quests until prerequisites are complete', async () => {
        vi.useFakeTimers();
        classifyQuestList.mockImplementation(({ quests: classifiedQuests = [] }) =>
            classifiedQuests.map((quest) => ({
                ...quest,
                status: quest.id === 'custom/locked' ? 'locked' : 'available',
            }))
        );
        listCustomQuests.mockResolvedValueOnce([
            {
                id: 'custom/locked',
                title: 'Locked Custom Quest',
                route: '/quests/custom/locked',
                custom: true,
            },
            {
                id: 'custom/ready',
                title: 'Ready Custom Quest',
                route: '/quests/custom/ready',
                custom: true,
            },
        ]);

        try {
            mountedComponent = mount(Quests, { target: host, props: { quests } });
            await vi.runAllTimersAsync();
            await vi.waitFor(() => expect(listCustomQuests).toHaveBeenCalled());

            await vi.waitFor(() => {
                const customSection = host.querySelector("[data-testid='custom-quests-section']");
                expect(customSection).not.toBeNull();
                expect(customSection?.textContent).toContain('Ready Custom Quest');
                expect(customSection?.textContent).not.toContain('Locked Custom Quest');
                expect(customSection?.textContent).not.toContain('Locked');

                const mergeStatus = host.querySelector(
                    "[data-testid='custom-quests-merge-status']"
                );
                expect(mergeStatus?.getAttribute('data-custom-count')).toBe('1');
            });
        } finally {
            vi.useRealTimers();
        }
    });

    it('moves completed custom quests into Completed Quests and removes completed label text', async () => {
        vi.useFakeTimers();
        classifyQuestList.mockImplementation(({ quests: classifiedQuests = [] }) =>
            classifiedQuests.map((quest) => ({
                ...quest,
                status: quest.id === 'custom/completed' ? 'completed' : 'available',
            }))
        );
        listCustomQuests.mockResolvedValueOnce([
            {
                id: 'custom/completed',
                title: 'Completed Custom Quest',
                route: '/quests/custom/completed',
                custom: true,
            },
            {
                id: 'custom/available',
                title: 'Available Custom Quest',
                route: '/quests/custom/available',
                custom: true,
            },
        ]);

        try {
            mountedComponent = mount(Quests, { target: host, props: { quests } });
            await vi.runAllTimersAsync();
            await vi.waitFor(() => expect(listCustomQuests).toHaveBeenCalled());

            const customSection = host.querySelector("[data-testid='custom-quests-section']");
            expect(customSection?.textContent).toContain('Available Custom Quest');
            expect(customSection?.textContent).not.toContain('Completed Custom Quest');

            expect(host.textContent).toContain('Completed Quests');
            const completedCustomQuestTile = host.querySelector(
                "a[data-questid='custom/completed'] [data-testid='quest-tile']"
            );
            expect(completedCustomQuestTile).not.toBeNull();
            expect(
                completedCustomQuestTile?.querySelector("[data-testid='quest-status-slot']")
            ).toBeNull();
            expect(
                completedCustomQuestTile
                    ?.querySelector('.sr-only')
                    ?.textContent?.includes('Status: Completed')
            ).toBe(true);
        } finally {
            vi.useRealTimers();
        }
    });
});
