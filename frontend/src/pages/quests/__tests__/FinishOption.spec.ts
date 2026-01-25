import { render, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FinishOption from '../svelte/option/FinishOption.svelte';

const finishQuestMock = vi.fn();
const loadGitHubTokenMock = vi.fn();
const isValidGitHubTokenMock = vi.fn();
const stateStore = writable({ inventory: {} as Record<string, number> });

vi.mock('../../../utils/gameState.js', () => ({
    finishQuest: (...args: unknown[]) => finishQuestMock(...args),
}));

vi.mock('../../../utils/githubToken.js', () => ({
    loadGitHubToken: () => loadGitHubTokenMock(), // scan-secrets: ignore
    isValidGitHubToken: (...args: unknown[]) => isValidGitHubTokenMock(...args), // scan-secrets: ignore
}));

vi.mock('../../../utils/gameState/common.js', () => ({
    state: {
        subscribe: (...args: unknown[]) => stateStore.subscribe(...args),
    },
    ready: Promise.resolve(),
    isGameStateReady: () => true,
}));

vi.mock('../../../utils/gameState/inventory.js', () => ({
    getItemCounts: () => ({ 'item-1': 0 }),
}));

vi.mock('../../../utils/itemResolver.js', () => ({
    getItemMap: async () =>
        new Map([
            [
                'item-1',
                {
                    id: 'item-1',
                    name: 'Test Item',
                    image: '/test.png',
                    releaseImage: () => {},
                },
            ],
        ]),
}));

vi.mock('../../../pages/inventory/json/items', () => ({
    default: [
        {
            id: 'item-1',
            name: 'Test Item',
            image: '/test.png',
        },
    ],
}));

describe('FinishOption', () => {
    beforeEach(() => {
        finishQuestMock.mockClear();
        loadGitHubTokenMock.mockResolvedValue(null);
        isValidGitHubTokenMock.mockReturnValue(true);
        stateStore.set({ inventory: {} });
    });

    it('displays required items and disables the option when requirements are missing', async () => {
        const option = {
            text: 'Finish quest',
            type: 'finish',
            requiresItems: [{ id: 'item-1', count: 1 }],
        };
        const quest = { id: 'quest-1', rewards: [] };

        const { getByRole, getByText } = render(FinishOption, {
            props: { option, quest },
        });

        const button = getByRole('button', { name: /finish quest/i });
        expect((button as HTMLButtonElement).disabled).toBe(true);
        expect(getByText('Requires:')).toBeTruthy();

        await fireEvent.click(button);
        expect(finishQuestMock).not.toHaveBeenCalled();
    });

    it('enables the option when required items are present', async () => {
        stateStore.set({ inventory: { 'item-1': 1 } });

        const option = {
            text: 'Finish quest',
            type: 'finish',
            requiresItems: [{ id: 'item-1', count: 1 }],
        };
        const quest = { id: 'quest-1', rewards: [] };

        const { getByRole } = render(FinishOption, {
            props: { option, quest },
        });

        const button = getByRole('button', { name: /finish quest/i });
        expect((button as HTMLButtonElement).disabled).toBe(false);

        await fireEvent.click(button);
        expect(finishQuestMock).toHaveBeenCalledWith('quest-1', []);
    });
});
