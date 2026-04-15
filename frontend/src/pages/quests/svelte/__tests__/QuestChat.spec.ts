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

const {
    mockState,
    canStartQuestMock,
    getUnmetQuestRequirementsMock,
    isGameStateReadyMock,
    readyPromiseRef,
} = vi.hoisted(() => {
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
        canStartQuestMock: vi.fn(() => true),
        getUnmetQuestRequirementsMock: vi.fn(() => [] as string[]),
        isGameStateReadyMock: vi.fn(() => true),
        readyPromiseRef: { current: Promise.resolve() as Promise<void> },
    };
});

vi.mock('../../../../utils/gameState/common.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../../utils/gameState/common.js')>();
    return {
        ...actual,
        state: mockState,
        syncGameStateFromLocalIfStale: vi.fn(),
        isGameStateReady: (...args: unknown[]) => isGameStateReadyMock(...args),
        get ready() {
            return readyPromiseRef.current;
        },
    };
});

vi.mock('../../../../utils/gameState.js', () => ({
    questFinished: vi.fn(() => false),
    canStartQuest: (...args: unknown[]) => canStartQuestMock(...args),
    getUnmetQuestRequirements: (...args: unknown[]) => getUnmetQuestRequirementsMock(...args),
    getItemsGranted: vi.fn(() => true),
    grantItems: vi.fn(),
    setCurrentDialogueStep: vi.fn(),
    finishQuest: vi.fn(),
}));

vi.mock('../../../../utils/itemResolver.js', () => ({
    getItemMap: vi.fn(async () => new Map([['item-1', { id: 'item-1', name: 'Test Item' }]])),
}));

describe('QuestChat', () => {
    beforeEach(() => {
        canStartQuestMock.mockReturnValue(true);
        getUnmetQuestRequirementsMock.mockReturnValue([]);
        isGameStateReadyMock.mockReturnValue(true);
        readyPromiseRef.current = Promise.resolve();
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

    it('shows unavailable gate instead of chat when requirements are unmet', async () => {
        canStartQuestMock.mockReturnValue(false);
        getUnmetQuestRequirementsMock.mockReturnValue(['welcome/howtodoquests', '3dprinter/start']);

        const quest = {
            id: 'hydroponics/bucket_10',
            title: "Bucket, we'll do it live!",
            description: 'Locked quest',
            image: '/quest.png',
            npc: '/npc.png',
            start: 'start',
            requiresQuests: ['welcome/howtodoquests', '3dprinter/start'],
            dialogue: [
                {
                    id: 'start',
                    text: 'You should not see this if the quest is locked.',
                    options: [{ id: 'finish', text: 'Finish', type: 'finish' }],
                },
            ],
            rewards: [{ id: 'item-1', count: 1 }],
        };

        const { container, getByTestId, getByRole, queryByText } = render(QuestChat, {
            props: { quest },
        });

        await waitFor(() => {
            expect(getByTestId('quest-unavailable').textContent).toContain(
                'Quest not available yet'
            );
        });

        expect(queryByText('You should not see this if the quest is locked.')).toBeNull();
        expect(container.querySelector('.npcDialogue')).toBeNull();
        expect(container.textContent).not.toContain('Locked');
        expect(container.textContent).toContain('Not available yet');
        expect(container.textContent).not.toContain('In Progress');
        const howToDoQuestsLink = getByRole('link', { name: 'How to do quests' });
        expect(howToDoQuestsLink.getAttribute('href')).toBe('/quests/welcome/howtodoquests');
        expect(howToDoQuestsLink.classList.contains('inverted')).toBe(true);
        expect(
            getByRole('link', { name: 'Set up your first 3D printer' }).getAttribute('href')
        ).toBe('/quests/3dprinting/start');
    });

    it('waits for game state readiness before showing unavailable messaging', async () => {
        let resolveReady = () => {};
        readyPromiseRef.current = new Promise<void>((resolve) => {
            resolveReady = resolve;
        });
        isGameStateReadyMock.mockReturnValue(false);
        canStartQuestMock.mockReturnValue(false);
        getUnmetQuestRequirementsMock.mockReturnValue(['welcome/howtodoquests']);

        const quest = {
            id: 'hydroponics/bucket_10',
            title: "Bucket, we'll do it live!",
            description: 'Locked quest',
            image: '/quest.png',
            npc: '/npc.png',
            start: 'start',
            requiresQuests: ['welcome/howtodoquests'],
            dialogue: [
                {
                    id: 'start',
                    text: 'You should not see this if the quest is locked.',
                    options: [{ id: 'finish', text: 'Finish', type: 'finish' }],
                },
            ],
            rewards: [{ id: 'item-1', count: 1 }],
        };

        const { container, queryByTestId, queryByText } = render(QuestChat, {
            props: { quest },
        });

        expect(container.querySelector('.temp-container')).not.toBeNull();
        expect(queryByTestId('quest-unavailable')).toBeNull();
        expect(queryByText('Quest not available yet')).toBeNull();

        resolveReady();

        await waitFor(() => {
            expect(queryByTestId('quest-unavailable')).not.toBeNull();
        });
    });
});
