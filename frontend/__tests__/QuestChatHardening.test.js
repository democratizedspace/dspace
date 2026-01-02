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
    state: writable({ quests: {} }),
}));

jest.mock('../src/utils/gameState.js', () => ({
    questFinished: jest.fn(() => false),
}));

jest.mock('../src/pages/inventory/json/items', () => [
    { id: 'item-1', name: 'Test Item', image: '/item.png' },
]);

describe('QuestChat hardening metadata', () => {
    it('does not render hardening information in the quest UI', () => {
        const quest = {
            id: 'quest-1',
            title: 'Test quest',
            description: 'Quest without explicit hardening',
            image: '/quest.png',
            npc: '/npc.png',
            start: 'start',
            hardening: {
                emoji: '🛡️',
                score: 80,
                passes: 2,
            },
            dialogue: [
                {
                    id: 'start',
                    text: 'Begin quest',
                    options: [{ id: 'finish', text: 'Finish', type: 'finish' }],
                },
            ],
            rewards: [{ id: 'item-1', count: 1 }],
        };

        const { container, queryByTestId } = render(QuestChat, { props: { quest } });

        expect(queryByTestId('quest-hardening-status')).toBeNull();
        expect(queryByTestId('quest-hardening-passes')).toBeNull();
        expect(container.textContent).not.toContain('Score 80/100');
        expect(container.textContent).not.toContain('Passes: 2');
    });
});
