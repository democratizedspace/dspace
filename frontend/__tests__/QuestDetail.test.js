/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import { jest } from 'vitest';
import QuestDetail from '../src/pages/quests/svelte/QuestDetail.svelte';

const mockGetQuest = jest.fn();
const mockGetBuiltInQuest = jest.fn();

jest.mock('../src/utils/customcontent.js', () => ({
    getQuest: (...args) => mockGetQuest(...args),
}));

jest.mock('../src/utils/builtInQuests.js', () => ({
    getBuiltInQuest: (...args) => mockGetBuiltInQuest(...args),
}));

jest.mock('../src/utils/gameState/common.js', () => ({
    state: jest.requireActual('svelte/store').writable({ quests: {} }),
}));

jest.mock('../src/utils/gameState.js', () => ({
    questFinished: jest.fn(() => false),
    setCurrentDialogueStep: jest.fn(),
}));

describe('QuestDetail quest chat rendering', () => {
    beforeEach(() => {
        mockGetQuest.mockReset();
        mockGetBuiltInQuest.mockReset();
    });

    it('renders QuestChat for custom quests with dialogue', async () => {
        const customQuest = {
            id: 'custom-quest-123',
            title: 'Custom Quest',
            description: 'Custom quest description',
            image: '/custom-quest.png',
            npc: '/custom-npc.png',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Hello from custom quest',
                    options: [
                        {
                            type: 'goto',
                            text: 'Go to next node',
                            goto: 'next',
                        },
                    ],
                },
                {
                    id: 'next',
                    text: 'Next node text',
                    options: [
                        {
                            type: 'finish',
                            text: 'Finish quest',
                        },
                    ],
                },
            ],
        };

        mockGetQuest.mockResolvedValue(customQuest);
        mockGetBuiltInQuest.mockReturnValue(null);

        const { findByTestId, findByText } = render(QuestDetail, {
            props: { questId: customQuest.id },
        });

        expect(await findByTestId('chat-panel')).toBeInTheDocument();
        expect(await findByText('Hello from custom quest')).toBeInTheDocument();
        expect(await findByText('Go to next node')).toBeInTheDocument();
    });
});
