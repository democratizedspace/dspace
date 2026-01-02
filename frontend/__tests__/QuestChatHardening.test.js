/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/svelte';
import { writable as mockWritable } from 'svelte/store';
import QuestChat from '../src/pages/quests/svelte/QuestChat.svelte';

jest.mock('../src/pages/quests/svelte/QuestChatOption.svelte', () => ({
    __esModule: true,
    default: {},
}));

jest.mock('../src/utils/gameState/common.js', () => ({
    state: mockWritable({ quests: {} }),
}));

jest.mock('../src/utils/gameState.js', () => ({
    questFinished: jest.fn(() => false),
}));

jest.mock('../src/pages/inventory/json/items', () => [
    { id: 'item-1', name: 'Test Item', image: '/item.png' },
]);

describe('QuestChat hardening metadata', () => {
    it('does not render hardening fields in the UI', () => {
        const quest = {
            id: 'quest-1',
            title: 'Test quest',
            description: 'Quest without explicit hardening',
            image: '/quest.png',
            npc: '/npc.png',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Begin quest',
                    options: [{ id: 'finish', text: 'Finish', type: 'finish' }],
                },
            ],
            rewards: [{ id: 'item-1', count: 1 }],
            hardening: {
                score: 90,
                passes: 3,
            },
        };

        const { queryByText } = render(QuestChat, { props: { quest } });

        expect(queryByText(/Hardening:/i)).toBeNull();
        expect(queryByText(/Passes:/i)).toBeNull();
        expect(queryByText(/Score .*\/100/i)).toBeNull();
    });
});
