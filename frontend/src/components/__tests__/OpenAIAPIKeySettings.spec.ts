import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/svelte';
import OpenAIAPIKeySettings from '../svelte/OpenAIAPIKeySettings.svelte';
import { loadGameState, saveGameState } from '../../utils/gameState/common.js';

vi.mock('../../utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveGameState: vi.fn(),
    ready: Promise.resolve(),
}));

describe('OpenAIAPIKeySettings', () => {
    beforeEach(() => {
        vi.mocked(loadGameState).mockReturnValue({
            openAI: { apiKey: '' },
            inventory: { '58580f6f-f3be-4be0-80b9-f6f8bf0b05a6': 3 },
        });
        vi.mocked(saveGameState).mockResolvedValue(undefined);
    });

    it('mentions the built-in knowledge base used for chat responses', async () => {
        const { findByText } = render(OpenAIAPIKeySettings);
        const info = await findByText((content) =>
            content.includes(
                'curated knowledge base covering quest lore, items, and highlights from your local inventory'
            )
        );
        expect(info).toBeInTheDocument();
    });

    it('does not clear an existing key when saving an empty edit draft', async () => {
        vi.mocked(loadGameState).mockReturnValue({
            openAI: { apiKey: 'sk-existing' },
            inventory: {},
        });

        const { findByRole, queryByText } = render(OpenAIAPIKeySettings);

        await fireEvent.click(await findByRole('button', { name: /edit api key/i }));
        await fireEvent.click(await findByRole('button', { name: /save openai api key/i }));

        expect(saveGameState).not.toHaveBeenCalled();
        expect(queryByText(/openai api key cleared/i)).not.toBeInTheDocument();
    });
});
