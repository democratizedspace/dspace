/**
 * @jest-environment jsdom
 */
import { render, waitFor } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { describe, expect, it, vi } from 'vitest';
import FinishOption from '../src/pages/quests/svelte/option/FinishOption.svelte';

vi.mock('../src/utils/gameState/common.js', () => ({
    state: writable({ inventory: [] }),
}));

vi.mock('../src/utils/gameState.js', () => ({
    finishQuest: vi.fn(),
}));

vi.mock('../src/utils/githubToken.js', () => ({
    loadGitHubToken: vi.fn(async () => ''), // scan-secrets: ignore
    isValidGitHubToken: vi.fn(() => false), // scan-secrets: ignore
}));

vi.mock('../src/pages/inventory/json/items', () => ({
    default: [{ id: 'reward-1', name: 'Reward', image: '/reward.png' }],
}));

describe('FinishOption GitHub gating', () => {
    it('shows a message when GitHub is required but not connected', async () => {
        const quest = { id: 'quest-1', rewards: [{ id: 'reward-1', count: 1 }] };
        const option = { type: 'finish', text: 'Finish', requiresGitHub: true };

        const { getByText } = render(FinishOption, { props: { quest, option } });

        await waitFor(() => {
            expect(getByText('Connect GitHub to finish this quest.')).toBeInTheDocument();
        });
    });
});
