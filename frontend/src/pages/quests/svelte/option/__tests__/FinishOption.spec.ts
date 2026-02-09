import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import FinishOption from '../FinishOption.svelte';

vi.mock('../../../../../utils/githubToken.js', () => ({
    loadGitHubToken: vi.fn().mockResolvedValue(''), // scan-secrets: ignore
    isValidGitHubToken: vi.fn().mockReturnValue(false), // scan-secrets: ignore
}));

vi.mock('../../../../../utils/gameState.js', () => ({
    finishQuest: vi.fn(),
}));

describe('FinishOption', () => {
    it('shows a GitHub gating message when connection is required', async () => {
        render(FinishOption, {
            quest: { id: 'welcome/connect-github', rewards: [] },
            option: { text: 'All set!', type: 'finish', requiresGitHub: true },
        });

        expect(await screen.findByText('Connect GitHub to finish this quest.')).not.toBeNull();
    });
});
