import { render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Quests from '../Quests.svelte';

const { listCustomQuestsMock, snapshotMock, isGameStateReadyMock } = vi.hoisted(() => ({
    listCustomQuestsMock: vi.fn(),
    snapshotMock: vi.fn(),
    isGameStateReadyMock: vi.fn(() => false),
}));

vi.mock('../../../../utils/customcontent.js', () => ({
    listCustomQuests: (...args: unknown[]) => listCustomQuestsMock(...args),
}));

vi.mock('../../../../utils/gameState/common.js', () => ({
    getPersistedQuestProgressSnapshot: (...args: unknown[]) => snapshotMock(...args),
    isGameStateReady: (...args: unknown[]) => isGameStateReadyMock(...args),
    loadGameState: vi.fn(() => ({ quests: {}, settings: {} })),
    ready: Promise.resolve(),
    state: {
        subscribe: vi.fn(() => () => undefined),
    },
}));

describe('Quests TTI rendering', () => {
    const quests = [
        {
            id: 'welcome/one',
            title: 'Welcome One',
            description: 'Description one',
            image: '/one.jpg',
            requiresQuests: [],
            route: '/quests/welcome/one',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        snapshotMock.mockResolvedValue({ trusted: false, completedQuestIds: [] });
        listCustomQuestsMock.mockResolvedValue([]);
    });

    it('renders built-in list immediately', async () => {
        render(Quests, { props: { quests } });
        expect(await screen.findByText('Welcome One')).toBeTruthy();
    });

    it('renders neutral status when snapshot is untrusted', async () => {
        render(Quests, { props: { quests } });
        await screen.findByText('Welcome One');
        expect(screen.getByTestId('quest-status').textContent).toContain('Status pending');
    });

    it('loads custom quests in separate section without replacing built-ins', async () => {
        listCustomQuestsMock.mockResolvedValue([
            {
                id: 'custom/two',
                title: 'Custom Two',
                description: 'Late loaded custom quest',
                image: '/two.jpg',
            },
        ]);

        render(Quests, { props: { quests } });
        await screen.findByText('Welcome One');

        await waitFor(() => {
            expect(screen.getByText('Custom Quests')).toBeTruthy();
            expect(screen.getByText('Custom Two')).toBeTruthy();
        });
    });
});
