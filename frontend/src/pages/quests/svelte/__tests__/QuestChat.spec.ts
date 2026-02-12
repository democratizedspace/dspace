import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import QuestChat from '../QuestChat.svelte';

vi.mock('../../../../utils/gameState.js', () => ({
    questFinished: vi.fn(() => false),
}));

vi.mock('../../../../utils/itemResolver.js', () => ({
    getItemMap: vi.fn(async () => new Map([['item-1', { id: 'item-1', name: 'Test Item' }]])),
}));

describe('QuestChat', () => {
    it('keeps inline code inline while escaping raw HTML', async () => {
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
            expect(dialogue?.innerHTML).not.toContain('<br');
            expect(dialogue?.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
            expect(dialogue?.querySelector('img')).toBeNull();
        });
    });
});
