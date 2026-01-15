import { render, screen, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import QuestDetail from '../src/pages/quests/svelte/QuestDetail.svelte';
import { getQuest } from '../src/utils/customcontent.js';
import { getBuiltInQuest } from '../src/utils/builtInQuests.js';

vi.mock('../src/utils/customcontent.js', () => ({
    getQuest: vi.fn(),
}));

vi.mock('../src/utils/builtInQuests.js', () => ({
    getBuiltInQuest: vi.fn(),
}));

describe('QuestDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
    });
});
