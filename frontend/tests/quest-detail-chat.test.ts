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

const { mockState } = vi.hoisted(() => {
    const createStore = <T,>(initial: T): Store<T> => {
        let value = initial;
        const subscribers = new Set<(current: T) => void>();
        const subscribe = (run: (current: T) => void) => {
            run(value);
            subscribers.add(run);
            return () => subscribers.delete(run);
        };
        const set = (next: T) => {
            value = next;
            subscribers.forEach((run) => run(value));
        };
        const update = (updater: (current: T) => T) => {
            set(updater(value));
        };
        return { subscribe, set, update };
    };

    const mockState = createStore<QuestState>({ quests: {}, inventory: {} });

    return { mockState };
});

vi.mock('../src/utils/customcontent.js', () => ({
    getQuest: vi.fn(),
}));

vi.mock('../src/utils/builtInQuests.js', () => ({
    getBuiltInQuest: vi.fn(),
}));

vi.mock('../src/utils/gameState/common.js', () => ({
    state: mockState,
    ready: Promise.resolve(),
    isGameStateReady: () => true,
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
            expect(screen.getByRole('button', { name: 'Finish quest' })).not.toBeNull();
        });
    });
});
