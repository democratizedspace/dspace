import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import FinishOption from '../FinishOption.svelte';
import { state } from '../../../../../utils/gameState/common.js';

vi.mock('../../../../../utils/githubToken.js', () => ({
    loadGitHubToken: vi.fn(() => Promise.resolve(null)), // scan-secrets: ignore
    isValidGitHubToken: vi.fn(() => false), // scan-secrets: ignore
}));

vi.mock('../../../../../utils/gameState.js', () => ({
    finishQuest: vi.fn(),
}));

describe('FinishOption', () => {
    it('shows a GitHub connection message when disconnected', async () => {
        state.set({ inventory: {} });

        const quest = { id: 'quest-1', rewards: [] };
        const option = { text: 'Finish', type: 'finish', requiresGitHub: true };
        const { getByText, container } = render(FinishOption, { props: { quest, option } });

        await waitFor(() => {
            expect(getByText('Connect GitHub to finish this quest.')).toBeTruthy();
        });

        const button = container.querySelector('button');
        expect(button?.disabled).toBe(true);
    });
});
