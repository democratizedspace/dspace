import { render, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuestChat from '../QuestChat.svelte';

type QuestState = {
    quests: Record<string, { stepId?: string; itemsClaimed?: string[] }>;
    inventory: Record<string, number>;
};

type Store<T> = {
    subscribe: (run: (value: T) => void) => () => void;
    set: (value: T) => void;
    update: (updater: (value: T) => T) => void;
};

const { mockState } = vi.hoisted(() => {
    let value: QuestState = { quests: {}, inventory: {} };
    const subscribers = new Set<(current: QuestState) => void>();
    const subscribe = (run: (current: QuestState) => void) => {
        run(value);
        subscribers.add(run);
        return () => subscribers.delete(run);
    };
    const set = (next: QuestState) => {
        value = next;
        subscribers.forEach((run) => run(value));
    };
    const update = (updater: (current: QuestState) => QuestState) => {
        set(updater(value));
    };
    return {
        mockState: { subscribe, set, update } as Store<QuestState>,
    };
});

vi.mock('../../../../utils/gameState/common.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../../utils/gameState/common.js')>();
    return {
        ...actual,
        state: mockState,
        syncGameStateFromLocalIfStale: vi.fn(),
        isGameStateReady: vi.fn(() => true),
        ready: Promise.resolve(),
    };
});

vi.mock('../../../../utils/gameState.js', () => ({
    questFinished: vi.fn(() => false),
    canStartQuest: vi.fn(() => true),
    getItemsGranted: vi.fn(() => true),
    grantItems: vi.fn(),
    setCurrentDialogueStep: vi.fn(),
    finishQuest: vi.fn(),
}));

vi.mock('../../../../utils/itemResolver.js', () => ({
    getItemMap: vi.fn(async () => new Map([['item-1', { id: 'item-1', name: 'Test Item' }]])),
}));

describe('QuestChat', () => {
    beforeEach(async () => {
        const gameState = await import('../../../../utils/gameState.js');
        vi.mocked(gameState.questFinished).mockImplementation(() => false);
        vi.mocked(gameState.canStartQuest).mockImplementation(() => true);
    });

    it('renders newline and inline code formatting while escaping raw HTML', async () => {
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

    it('blocks quest chat when quest requirements are not finished and links required quests', async () => {
        const gameState = await import('../../../../utils/gameState.js');
        vi.mocked(gameState.canStartQuest).mockReturnValue(false);
        vi.mocked(gameState.questFinished).mockImplementation(
            (questId: string) => questId === 'welcome/howtodoquests'
        );

        const quest = {
            id: 'hydroponics/bucket_10',
            title: 'Hydroponics Bucket',
            description: 'Locked until prerequisites are done',
            image: '/quest.png',
            npc: '/npc.png',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'This text should not show while locked.',
                    options: [{ id: 'finish', text: 'Finish', type: 'finish' }],
                },
            ],
            rewards: [{ id: 'item-1', count: 1 }],
            requiresQuests: ['hydroponics/basil', '3dprinter/start'],
        };

        const { getByTestId, queryByText, getByRole } = render(QuestChat, { props: { quest } });

        await waitFor(() => {
            expect(getByTestId('quest-locked-message').textContent).toContain(
                'Quest not available yet'
            );
            expect(queryByText('This text should not show while locked.')).toBeNull();
            expect(getByRole('link', { name: 'hydroponics/basil' }).getAttribute('href')).toBe(
                '/quests/hydroponics/basil'
            );
            expect(getByRole('link', { name: '3dprinter/start' }).getAttribute('href')).toBe(
                '/quests/3dprinter/start'
            );
        });
    });

    it('keeps rendering start dialogue and options when state is seeded from a start-node claim', async () => {
        const questId = 'aquaria/ph-strip-test';
        mockState.set({
            quests: {
                [questId]: {
                    stepId: 'start',
                    itemsClaimed: [`${questId}-start-0`],
                },
            },
            inventory: {},
        });

        const quest = {
            id: questId,
            title: 'Grant Claim Quest',
            description: 'Regression fixture',
            image: '/quest.png',
            npc: '/npc.png',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Claim your strip and continue.',
                    options: [
                        { text: 'Claim strip', type: 'grantsItems', grantsItems: [] },
                        { id: 'finish', text: 'Finish', type: 'finish' },
                    ],
                },
            ],
            rewards: [{ id: 'item-1', count: 1 }],
        };

        const { container } = render(QuestChat, { props: { quest } });

        await waitFor(() => {
            expect(container.querySelector('.npcDialogue')?.textContent).toContain(
                'Claim your strip and continue.'
            );
            const optionsText = container.querySelector('.options')?.textContent ?? '';
            expect(optionsText).toContain('Claim');
            expect(optionsText).toContain('Finish');
        });
    });
});
