import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import QuestDetail from '../src/pages/quests/svelte/QuestDetail.svelte';

vi.mock('../src/utils/gameState/common.js', async () => {
    const { writable } = await import('svelte/store');
    return {
        state: writable({ quests: {}, inventory: {} }),
    };
});

vi.mock('../src/utils/gameState.js', () => ({
    questFinished: vi.fn(() => false),
    setCurrentDialogueStep: vi.fn(),
    grantItems: vi.fn(),
    getItemsGranted: vi.fn(() => false),
    finishQuest: vi.fn(),
}));

const mockGetQuest = vi.fn();
vi.mock('../src/utils/customcontent.js', () => ({
    getQuest: (...args: unknown[]) => mockGetQuest(...args),
}));

vi.mock('../src/utils/builtInQuests.js', () => ({
    getBuiltInQuest: vi.fn(() => null),
}));

describe('QuestDetail custom quests', () => {
    it('renders QuestChat UI for custom quests with dialogue', async () => {
        mockGetQuest.mockResolvedValueOnce({
            id: 'custom-quest-1',
            title: 'Custom Quest',
            description: 'A custom quest with dialogue.',
            image: '/assets/quests/howtodoquests.jpg',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Welcome to the custom quest.',
                    options: [
                        {
                            type: 'goto',
                            goto: 'next',
                            text: 'Continue',
                        },
                    ],
                },
                {
                    id: 'next',
                    text: 'You made it to the next step.',
                    options: [
                        {
                            type: 'goto',
                            goto: 'start',
                            text: 'Loop back',
                        },
                    ],
                },
            ],
        });

        render(QuestDetail, { props: { questId: 'custom-quest-1' } });

        await waitFor(() => {
            expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
        });

        expect(screen.getByText('Welcome to the custom quest.')).toBeInTheDocument();
        expect(screen.getByText('Continue')).toBeInTheDocument();
    });
});
