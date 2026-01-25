import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tick } from 'svelte';
import FinishOption from '../src/pages/quests/svelte/option/FinishOption.svelte';

const { stateStore, finishQuestMock, getStateSnapshot } = vi.hoisted(() => {
    let snapshot = { inventory: {} as Record<string, number> };
    const subscribers = new Set<(value: typeof snapshot) => void>();
    const stateStore = {
        subscribe: (run: (value: typeof snapshot) => void) => {
            run(snapshot);
            subscribers.add(run);
            return () => subscribers.delete(run);
        },
        set: (value: typeof snapshot) => {
            snapshot = value;
            subscribers.forEach((run) => run(snapshot));
        },
        update: (updater: (value: typeof snapshot) => typeof snapshot) => {
            stateStore.set(updater(snapshot));
        },
    };

    return {
        stateStore,
        finishQuestMock: vi.fn(),
        getStateSnapshot: () => snapshot,
    };
});

vi.mock('../src/utils/gameState/common.js', () => ({
    state: stateStore,
    ready: Promise.resolve(),
    isGameStateReady: () => true,
    loadGameState: () => getStateSnapshot(),
    saveGameState: vi.fn(),
}));

vi.mock('../src/utils/gameState.js', () => ({
    finishQuest: finishQuestMock,
}));

vi.mock('../src/utils/githubToken.js', () => ({
    loadGitHubToken: vi.fn(() => ''),
    isValidGitHubToken: vi.fn(() => false),
}));

vi.mock('../src/utils/itemResolver.js', () => ({
    getItemMap: vi.fn(async (ids = []) => {
        const namesById: Record<string, string> = {
            'item-1': 'Required Widget',
            'reward-1': 'Reward Widget',
        };

        return new Map(
            ids.map((id: string) => [
                String(id),
                {
                    id: String(id),
                    name: namesById[String(id)] ?? `Item ${id}`,
                    image: `/images/${id}.png`,
                    releaseImage: null,
                },
            ])
        );
    }),
}));

describe('FinishOption quest requirements', () => {
    beforeEach(() => {
        finishQuestMock.mockClear();
        stateStore.set({ inventory: {} });
    });

    it('disables finish option and shows required items when missing inventory', async () => {
        const quest = {
            id: 'quest-1',
            rewards: [{ id: 'reward-1', count: 1 }],
        };
        const option = {
            text: 'Finish quest',
            requiresItems: [{ id: 'item-1', count: 1 }],
        };

        const { getByRole, getByText, findByAltText } = render(FinishOption, {
            props: { quest, option },
        });

        const button = getByRole('button', { name: /Finish quest/ });
        expect(button).toBeDisabled();
        expect(getByText('Requires:')).toBeInTheDocument();
        expect(await findByAltText('Required Widget')).toBeInTheDocument();

        await fireEvent.click(button);
        expect(finishQuestMock).not.toHaveBeenCalled();
    });

    it('shows no requirements and stays enabled when no items are required', () => {
        const quest = {
            id: 'quest-1',
            rewards: [{ id: 'reward-1', count: 1 }],
        };
        const option = {
            text: 'Finish quest',
        };

        const { getByRole, queryByText, queryByAltText } = render(FinishOption, {
            props: { quest, option },
        });

        const button = getByRole('button', { name: /Finish quest/ });
        expect(button).toBeEnabled();
        expect(queryByText('Requires:')).not.toBeInTheDocument();
        expect(queryByAltText('Required Widget')).not.toBeInTheDocument();
    });

    it('enables finish option when inventory meets requirements', async () => {
        const quest = {
            id: 'quest-1',
            rewards: [{ id: 'reward-1', count: 1 }],
        };
        const option = {
            text: 'Finish quest',
            requiresItems: [{ id: 'item-1', count: 1 }],
        };

        const { getByRole } = render(FinishOption, { props: { quest, option } });
        const button = getByRole('button', { name: /Finish quest/ });

        stateStore.set({ inventory: { 'item-1': 1 } });
        await tick();

        expect(button).toBeEnabled();
        await fireEvent.click(button);
        expect(finishQuestMock).toHaveBeenCalledWith('quest-1', quest.rewards);
    });
});
