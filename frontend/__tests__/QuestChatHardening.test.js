/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import QuestChat from '../src/pages/quests/svelte/QuestChat.svelte';
import { DEFAULT_HARDENING } from '../src/utils/hardening.js';

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

describe('QuestChat hardening fallback', () => {
    it('displays default hardening metrics when metadata is missing', () => {
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

        const { getByTestId } = render(QuestChat, { props: { quest } });

        expect(getByTestId('quest-hardening-status')).toHaveTextContent(
            `${DEFAULT_HARDENING.emoji} Score ${DEFAULT_HARDENING.score}/100`
        );
        expect(getByTestId('quest-hardening-passes')).toHaveTextContent(
            `Passes: ${DEFAULT_HARDENING.passes}`
        );
    });
});
