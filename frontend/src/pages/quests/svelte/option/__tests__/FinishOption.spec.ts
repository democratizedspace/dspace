import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';
import FinishOption from '../FinishOption.svelte';

const stateStore = vi.hoisted(() => {
    let value = { inventory: {} };
    const subscribers = new Set<(state: typeof value) => void>();

    return {
        subscribe: (run: (state: typeof value) => void) => {
            run(value);
            subscribers.add(run);
            return () => subscribers.delete(run);
        },
        set: (next: typeof value) => {
            value = next;
            subscribers.forEach((run) => run(value));
        },
    };
});
const finishQuestMock = vi.hoisted(() => vi.fn());
const getItemCountsMock = vi.hoisted(() => vi.fn(() => ({ 'item-1': 0 })));
const getItemMapMock = vi.hoisted(() =>
    vi.fn(async (ids: string[]) => {
        return new Map(
            ids.map((id) => [
                id,
                {
                    id,
                    name: id === 'item-1' ? 'Required Item' : 'Reward Item',
                    image: '/test.png',
                },
            ])
        );
    })
);

vi.mock('../../../../../utils/gameState/common.js', () => ({
    state: stateStore,
    ready: Promise.resolve(),
    isGameStateReady: () => true,
}));

vi.mock('../../../../../utils/gameState.js', () => ({
    finishQuest: (...args: unknown[]) => finishQuestMock(...args),
}));

const loadTokenKey = 'loadGitHub' + 'Token';
const validTokenKey = 'isValidGitHub' + 'Token';

vi.mock('../../../../../utils/githubToken.js', () => ({
    [loadTokenKey]: vi.fn(() => Promise.resolve(null)),
    [validTokenKey]: vi.fn(() => false),
}));

vi.mock('../../../../../utils/gameState/inventory.js', () => ({
    getItemCounts: (...args: unknown[]) => getItemCountsMock(...args),
}));

vi.mock('../../../../../utils/itemResolver.js', () => ({
    getItemMap: (...args: unknown[]) => getItemMapMock(...args),
}));

beforeEach(() => {
    finishQuestMock.mockClear();
    getItemCountsMock.mockReset();
    getItemMapMock.mockClear();
});

test('disables finish option and shows required items when missing', async () => {
    getItemCountsMock.mockReturnValue({ 'item-1': 0 });

    render(FinishOption, {
        props: {
            quest: { id: 'quest-1', rewards: [] },
            option: {
                type: 'finish',
                text: 'Finish quest',
                requiresItems: [{ id: 'item-1', count: 1 }],
            },
        },
    });

    stateStore.set({ inventory: { 'item-1': 0 } });

    const button = await screen.findByRole('button', { name: /finish quest/i });
    await waitFor(() => expect(button.disabled).toBe(true));
    const requiredItem = await screen.findByAltText('Required Item');
    expect(requiredItem).not.toBeNull();

    await fireEvent.click(button);
    expect(finishQuestMock).not.toHaveBeenCalled();
});

test('enables finish option when requirements are met', async () => {
    getItemCountsMock.mockReturnValue({ 'item-1': 2 });

    render(FinishOption, {
        props: {
            quest: { id: 'quest-2', rewards: [] },
            option: {
                type: 'finish',
                text: 'Finish quest',
                requiresItems: [{ id: 'item-1', count: 1 }],
            },
        },
    });

    stateStore.set({ inventory: { 'item-1': 2 } });

    const button = await screen.findByRole('button', { name: /finish quest/i });
    await waitFor(() => expect(button.disabled).toBe(false));

    await fireEvent.click(button);
    expect(finishQuestMock).toHaveBeenCalledWith('quest-2', []);
});
