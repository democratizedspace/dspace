/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { describe, expect, it, vi } from 'vitest';
import QuestDetail from '../src/pages/quests/svelte/QuestDetail.svelte';
import { getQuest } from '../src/utils/customcontent.js';

vi.mock('../src/utils/customcontent.js', () => ({
    getQuest: vi.fn(),
}));

vi.mock('../src/utils/builtInQuests.js', () => ({
    getBuiltInQuest: vi.fn(() => null),
}));

vi.mock('../src/utils/gameState/common.js', () => ({
    state: writable({ quests: {}, inventory: {} }),
}));

vi.mock('../src/utils/gameState.js', () => ({
    questFinished: vi.fn(() => false),
    setCurrentDialogueStep: vi.fn(),
    finishQuest: vi.fn(),
}));

vi.mock('../src/pages/inventory/json/items', () => []);

describe('QuestDetail custom quest rendering', () => {
    it('renders QuestChat for a custom quest with dialogue', async () => {
        const mockQuest = {
            id: 'custom-quest-1',
            title: 'Custom Quest',
            description: 'Custom quest description.',
            image: '/assets/quests/howtodoquests.jpg',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Custom quest greeting.',
                    options: [{ type: 'goto', text: 'Continue', goto: 'next' }],
                },
                {
                    id: 'next',
                    text: 'Next step.',
                    options: [{ type: 'finish', text: 'Finish quest' }],
                },
            ],
            rewards: [],
            requiresQuests: [],
        };

        vi.mocked(getQuest).mockResolvedValue(mockQuest);

        render(QuestDetail, { props: { questId: 'custom-quest-1' } });

        const chatPanel = await screen.findByTestId('chat-panel');
        expect(chatPanel).toBeInTheDocument();
        expect(await screen.findByText('Custom quest greeting.')).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: 'Continue' })).toBeInTheDocument();
    });
});
