import { render } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { describe, expect, it, vi } from 'vitest';
import Quests from '../svelte/Quests.svelte';

const mockState = writable({ settings: { showQuestGraphVisualizer: false } });

vi.mock('../../../../utils/gameState.js', () => ({
    questFinished: vi.fn(() => false),
    canStartQuest: vi.fn(() => true),
}));

vi.mock('../../../../utils/customcontent.js', () => ({
    listCustomQuests: vi.fn(async () => []),
}));

vi.mock('../../../../utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({ settings: { showQuestGraphVisualizer: false } })),
    ready: Promise.resolve(),
    state: mockState,
}));

describe('Quests layout', () => {
    it('adds stretch-ready quest link wrappers in the grid', async () => {
        const quests = [
            {
                id: 'astronomy/basic-telescope',
                title: 'Assemble a Simple Telescope',
                description: 'Long description to force tile growth in a grid row.',
                image: '/test.jpg',
            },
        ];

        const { container } = render(Quests, { quests });
        await new Promise((resolve) => setTimeout(resolve, 0));

        const questLinks = container.querySelectorAll('.quests-grid > a.quest-link');
        expect(questLinks).toHaveLength(1);
    });
});
