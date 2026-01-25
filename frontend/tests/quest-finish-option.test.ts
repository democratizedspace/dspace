import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writable } from 'svelte/store';
import { tick } from 'svelte';
import FinishOption from '../src/pages/quests/svelte/option/FinishOption.svelte';

const { stateStore, finishQuestMock, getStateSnapshot } = vi.hoisted(() => {
    const stateStore = writable({ inventory: {} as Record<string, number> });
    let snapshot = { inventory: {} as Record<string, number> };
    stateStore.subscribe((value) => {
        snapshot = value;
    });

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

        const { getByRole, getByText } = render(FinishOption, { props: { quest, option } });

        const button = getByRole('button', { name: 'Finish quest' });
        expect(button).toBeDisabled();
        expect(getByText('Requires:')).toBeInTheDocument();

        await fireEvent.click(button);
        expect(finishQuestMock).not.toHaveBeenCalled();
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
        const button = getByRole('button', { name: 'Finish quest' });

        stateStore.set({ inventory: { 'item-1': 1 } });
        await tick();

        expect(button).toBeEnabled();
        await fireEvent.click(button);
        expect(finishQuestMock).toHaveBeenCalledWith('quest-1', quest.rewards);
    });
});
