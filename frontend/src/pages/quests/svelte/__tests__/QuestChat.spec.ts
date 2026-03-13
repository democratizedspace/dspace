import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import QuestChat from '../QuestChat.svelte';

import { state } from '../../../../utils/gameState/common.js';

vi.mock('../../../../utils/gameState.js', () => ({
    questFinished: vi.fn(() => false),
    getItemsGranted: vi.fn(() => false),
    grantItems: vi.fn(),
}));

vi.mock('../../../../utils/itemResolver.js', () => ({
    getItemMap: vi.fn(async () => new Map([['item-1', { id: 'item-1', name: 'Test Item' }]])),
}));

describe('QuestChat', () => {
    it('renders newline and inline code formatting while escaping raw HTML', async () => {
        state.set({ quests: {}, inventory: {} });
        const quest = {
            id: 'quest-2',
            title: 'Formatting quest',
            description: 'Quest with formatted dialogue',
            image: '/quest.png',
            npc: '/npc.png',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Run `npm test`\n<img src=x onerror=alert(1)>',
                    options: [{ id: 'finish', text: 'Finish', type: 'finish' }],
                },
            ],
            rewards: [{ id: 'item-1', count: 1 }],
        };

        const { container } = render(QuestChat, { props: { quest } });

        await waitFor(() => {
            const dialogue = container.querySelector('.npcDialogue');
            expect(dialogue).not.toBeNull();
            expect(dialogue?.innerHTML).toContain('<code>npm test</code>');
            expect(dialogue?.innerHTML).toContain('<br');
            expect(dialogue?.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
            expect(dialogue?.querySelector('img')).toBeNull();
        });
    });

    it('falls back to quest start when saved step id is missing from dialogue', async () => {
        const quest = {
            id: 'hydroponics/top-off',
            title: 'Top Off the Reservoir',
            description: 'Add fresh water to keep nutrient levels stable.',
            image: '/quest.png',
            npc: '/npc.png',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Evaporation and thirsty roots drop water level fast.',
                    options: [
                        {
                            type: 'grantsItems',
                            text: 'Sync the working reservoir state before top-off.',
                            grantsItems: [{ id: 'item-1', count: 1 }],
                        },
                    ],
                },
            ],
            rewards: [{ id: 'item-1', count: 1 }],
        };

        state.set({
            inventory: {},
            quests: {
                [quest.id]: {
                    stepId: 'removed-or-renamed-step',
                },
            },
        });

        const { getByText } = render(QuestChat, { props: { quest } });

        await waitFor(() => {
            expect(getByText('Evaporation and thirsty roots drop water level fast.')).toBeTruthy();
            expect(getByText('Sync the working reservoir state before top-off.')).toBeTruthy();
        });
    });
});
