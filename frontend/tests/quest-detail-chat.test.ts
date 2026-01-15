import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import QuestDetail from '../src/pages/quests/svelte/QuestDetail.svelte';
import { getQuest } from '../src/utils/customcontent.js';
import { getBuiltInQuest } from '../src/utils/builtInQuests.js';

import type { Writable } from 'svelte/store';

type QuestState = {
    quests: Record<string, { stepId: string }>;
    inventory: Record<string, number>;
};

let stateStore: Writable<QuestState>;

vi.mock('../src/utils/customcontent.js', () => ({
    getQuest: vi.fn(),
}));

vi.mock('../src/utils/builtInQuests.js', () => ({
    getBuiltInQuest: vi.fn(),
}));

vi.mock('../src/utils/gameState/common.js', async () => {
    const { writable } = await vi.importActual<typeof import('svelte/store')>('svelte/store');
    const state = writable<QuestState>({ quests: {}, inventory: {} });
    return { state };
});

vi.mock('../src/utils/gameState.js', async () => {
    const { state } = await import('../src/utils/gameState/common.js');
    return {
        questFinished: vi.fn(() => false),
        setCurrentDialogueStep: vi.fn((questId: string, stepId: string) => {
            state.update((current: QuestState) => ({
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
    };
});

describe('QuestDetail', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { state } = await import('../src/utils/gameState/common.js');
        stateStore = state as Writable<QuestState>;
        stateStore.set({ quests: {}, inventory: {} });
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
            requiresQuests: [],
        };

        vi.mocked(getQuest).mockResolvedValue(customQuest);
        vi.mocked(getBuiltInQuest).mockReturnValue(null);

        render(QuestDetail, { questId: customQuest.id });

        await waitFor(() => {
            expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText('Hello from the custom quest!')).toBeInTheDocument();
            expect(screen.getByText('Continue')).toBeInTheDocument();
        });

        const continueButton = screen.getByRole('button', { name: 'Continue' });
        await fireEvent.click(continueButton);

        await waitFor(() => {
            expect(screen.getByText('Second node reached.')).toBeInTheDocument();
        });
    });

    it('renders an error when dialogue is missing', async () => {
        const customQuest = {
            id: 'custom-quest-no-dialogue',
            title: 'Custom Quest Without Dialogue',
            description: 'Missing dialogue for testing.',
            image: '/assets/quests/custom.png',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            requiresQuests: [],
        };

        vi.mocked(getQuest).mockResolvedValue(customQuest);
        vi.mocked(getBuiltInQuest).mockReturnValue(null);

        render(QuestDetail, { questId: customQuest.id });

        await waitFor(() => {
            expect(screen.getByText('Quest dialogue missing')).toBeInTheDocument();
            expect(
                screen.getByText('This quest does not have dialogue to display.')
            ).toBeInTheDocument();
        });
    });
});
