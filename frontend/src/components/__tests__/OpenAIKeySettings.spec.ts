import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/svelte';
import OpenAIKeySettings from '../svelte/OpenAIKeySettings.svelte';
import { loadGameState, saveGameState } from '../../utils/gameState/common.js';

vi.mock('../../utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveGameState: vi.fn(),
    ready: Promise.resolve(),
}));

describe('OpenAIKeySettings', () => {
    beforeEach(() => {
        vi.mocked(loadGameState).mockReturnValue({
            openAI: { apiKey: '' },
            inventory: { '58580f6f-f3be-4be0-80b9-f6f8bf0b05a6': 3 },
        });
        vi.mocked(saveGameState).mockResolvedValue(undefined);
    });

    it('mentions the built-in knowledge base used for chat responses', async () => {
        const { findByText } = render(OpenAIKeySettings);
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

        const { findByRole, queryByText } = render(OpenAIKeySettings);

        await fireEvent.click(await findByRole('button', { name: /edit api key/i }));
        await fireEvent.click(await findByRole('button', { name: /save openai api key/i }));

        expect(saveGameState).not.toHaveBeenCalled();
        expect(queryByText(/openai api key cleared/i)).not.toBeInTheDocument();
    });

    it('saves a trimmed OpenAI API key and shows the configured state', async () => {
        const { findByLabelText, findByRole, findByText } = render(OpenAIKeySettings);

        await fireEvent.input(await findByLabelText(/openai api key/i), {
            target: { value: '  sk-new-key  ' },
        });
        await fireEvent.click(await findByRole('button', { name: /save openai api key/i }));

        expect(saveGameState).toHaveBeenCalledWith(
            expect.objectContaining({ openAI: { apiKey: 'sk-new-key' } })
        );
        expect(await findByText(/openai api key saved/i)).toBeInTheDocument();
        expect(await findByText(/openai api key configured/i)).toBeInTheDocument();
    });

    it('clears an existing OpenAI API key when requested', async () => {
        vi.mocked(loadGameState).mockReturnValue({
            openAI: { apiKey: 'sk-existing' },
            inventory: {},
        });

        const { findByRole, findByText, findByLabelText } = render(OpenAIKeySettings);

        await fireEvent.click(await findByRole('button', { name: /clear api key/i }));

        expect(saveGameState).toHaveBeenCalledWith(
            expect.objectContaining({ openAI: { apiKey: '' } })
        );
        expect(await findByText(/openai api key cleared/i)).toBeInTheDocument();
        expect(await findByLabelText(/openai api key/i)).toBeInTheDocument();
    });
});
