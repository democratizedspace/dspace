/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import QuestChat from '../src/pages/quests/svelte/QuestChat.svelte';

jest.mock('../src/pages/quests/svelte/QuestChatOption.svelte', () => ({
    __esModule: true,
    default: {},
}));

jest.mock('../src/utils/gameState/common.js', () => ({
    state: jest.requireActual('svelte/store').writable({ quests: {} }),
}));

jest.mock('../src/utils/gameState.js', () => ({
    questFinished: jest.fn(() => false),
}));

jest.mock('../src/pages/inventory/json/items', () => [
    { id: 'item-1', name: 'Test Item', image: '/item.png' },
]);

describe('QuestChat hardening metadata', () => {
    it('does not render hardening metrics for players', () => {
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
        };

        const { queryByTestId, queryByText } = render(QuestChat, { props: { quest } });

        expect(queryByTestId('quest-hardening-status')).toBeNull();
        expect(queryByTestId('quest-hardening-passes')).toBeNull();
        expect(queryByText(/hardening/i)).toBeNull();
    });
});
