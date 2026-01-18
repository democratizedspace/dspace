import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuestDetail from '../src/pages/quests/svelte/QuestDetail.svelte';
import { getQuest } from '../src/utils/customcontent.js';
import { getBuiltInQuest } from '../src/utils/builtInQuests.js';

type QuestState = {
    quests: Record<string, { stepId: string }>;
    inventory: Record<string, number>;
};

type Store<T> = {
    subscribe: (run: (value: T) => void) => () => void;
    set: (value: T) => void;
    update: (updater: (value: T) => T) => void;
};

let mockState: Store<QuestState>;
let getMockStateValue: () => QuestState;

vi.hoisted(() => {
    let value: QuestState = { quests: {}, inventory: {} };
    const subscribers = new Set<(current: QuestState) => void>();
    const subscribe = (run: (current: QuestState) => void) => {
        run(value);
        subscribers.add(run);
        return () => subscribers.delete(run);
    };
    const set = (next: QuestState) => {
        value = next;
        subscribers.forEach((run) => run(value));
    };
    const update = (updater: (current: QuestState) => QuestState) => {
        set(updater(value));
    };
    mockState = { subscribe, set, update } as Store<QuestState>;
    getMockStateValue = () => value;
});

vi.mock('../src/utils/gameState/common.js', () => ({
    state: mockState,
    ready: Promise.resolve(),
    isGameStateReady: () => true,
    loadGameState: () => getMockStateValue(),
    saveGameState: vi.fn(),
}));

vi.mock('../src/utils/gameState.js', () => ({
    questFinished: vi.fn(() => false),
    setCurrentDialogueStep: vi.fn((questId: string, stepId: string) => {
        mockState.update((current: QuestState) => ({
            ...current,
            quests: {
                ...current.quests,
                [questId]: { stepId },
            },
        }));
    }),
    finishQuest: vi.fn(),
    grantItems: vi.fn(),
    getItemsGranted: vi.fn(() => false),
}));

vi.mock('../src/utils/customcontent.js', () => ({
    getQuest: vi.fn(),
}));

vi.mock('../src/utils/builtInQuests.js', () => ({
    getBuiltInQuest: vi.fn(),
}));

describe('QuestDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockState.set({ quests: {}, inventory: {} });
    });

    it('renders QuestChat for custom quests with dialogue', async () => {
        const customQuest = {
            id: 'custom-quest-uuid',
            title: 'Custom Quest',
            description: 'Custom quest description for testing.',
            image: '/assets/quests/custom.png',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Hello from the custom quest!',
                    options: [{ type: 'goto', goto: 'next', text: 'Continue' }],
                },
                {
                    id: 'next',
                    text: 'Second node reached.',
                    options: [{ type: 'finish', text: 'Finish' }],
                },
            ],
            rewards: [],
            requiresQuests: [],
        };

        vi.mocked(getQuest).mockResolvedValue(customQuest);
        vi.mocked(getBuiltInQuest).mockReturnValue(null);

        render(QuestDetail, { props: { questId: customQuest.id } });

        await waitFor(() => {
            expect(screen.getByTestId('chat-panel')).not.toBeNull();
        });

        await waitFor(() => {
            expect(screen.getByText('Hello from the custom quest!')).not.toBeNull();
            expect(screen.getByText('Continue')).not.toBeNull();
        });

        const continueButton = screen.getByRole('button', { name: 'Continue' });
        await fireEvent.click(continueButton);

        await waitFor(() => {
            expect(screen.getByText('Second node reached.')).not.toBeNull();
        });
    });

    it('renders default dialogue when dialogue is missing', async () => {
        const customQuest = {
            id: 'custom-quest-no-dialogue',
            title: 'Custom Quest Without Dialogue',
            description: 'Missing dialogue for testing.',
            image: '/assets/quests/custom.png',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            rewards: [],
            requiresQuests: [],
        };

        vi.mocked(getQuest).mockResolvedValue(customQuest);
        vi.mocked(getBuiltInQuest).mockReturnValue(null);

        render(QuestDetail, { props: { questId: customQuest.id } });

        await waitFor(() => {
            expect(screen.getByText('This custom quest ends immediately.')).not.toBeNull();
            expect(screen.getAllByRole('button', { name: /finish/i }).length).toBeGreaterThan(0);
        });
    });
});
