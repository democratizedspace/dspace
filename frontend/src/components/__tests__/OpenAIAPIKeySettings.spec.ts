import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/svelte';
import OpenAIAPIKeySettings from '../svelte/OpenAIAPIKeySettings.svelte';
import { loadGameState, saveCredential, clearCredential } from '../../utils/gameState/common.js';

vi.mock('../../utils/gameState/common.js', () => ({
    loadGameState: vi.fn(),
    saveCredential: vi.fn(),
    clearCredential: vi.fn(async () => ({ status: 'complete' })),
    ready: Promise.resolve(),
}));

describe('OpenAIAPIKeySettings', () => {
    beforeEach(() => {
        vi.mocked(loadGameState).mockReturnValue({
            openAI: { apiKey: '' },
            inventory: { '58580f6f-f3be-4be0-80b9-f6f8bf0b05a6': 3 },
        });
        vi.mocked(saveCredential).mockResolvedValue(undefined);
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

        expect(saveCredential).not.toHaveBeenCalled();
        expect(queryByText(/openai api key cleared/i)).not.toBeInTheDocument();
    });

    it('saves a trimmed OpenAI API key and shows the configured state', async () => {
        const { findByLabelText, findByRole, findByText } = render(OpenAIAPIKeySettings);

        await fireEvent.input(await findByLabelText(/openai api key/i), {
            target: { value: '  sk-new-key  ' },
        });
        await fireEvent.click(await findByRole('button', { name: /save openai api key/i }));

        expect(saveCredential).toHaveBeenCalledWith('openAI', 'sk-new-key');
        expect(await findByText(/openai api key saved/i)).toBeInTheDocument();
        expect(await findByText(/openai api key configured/i)).toBeInTheDocument();
    });

    it('clears an existing OpenAI API key when requested', async () => {
        vi.mocked(loadGameState).mockReturnValue({
            openAI: { apiKey: 'sk-existing' },
            inventory: {},
        });

        const { findByRole, findByText, findByLabelText } = render(OpenAIAPIKeySettings);

        await fireEvent.click(await findByRole('button', { name: /clear api key/i }));

        expect(clearCredential).toHaveBeenCalledWith('openAI');
        expect(await findByText(/openai api key cleared/i)).toBeInTheDocument();
        expect(await findByLabelText(/openai api key/i)).toBeInTheDocument();
    });
});

it('reports incomplete Clear and erases the editor draft before retry', async () => {
    vi.mocked(loadGameState).mockReturnValue({ openAI: { apiKey: '' } });
    vi.mocked(clearCredential).mockResolvedValueOnce({ status: 'incomplete' });
    const { findByLabelText, findByRole, findByText } = render(OpenAIAPIKeySettings);
    const input = await findByLabelText(/openai api key/i);
    await fireEvent.input(input, { target: { value: 'SENTINEL_UNSAVED_DRAFT' } });
    await fireEvent.click(await findByRole('button', { name: /clear api key/i }));
    expect(await findByText(/clear incomplete. Retry Clear to finish/i)).toBeInTheDocument();
    expect(input).toHaveValue('');
});

it('reports Clear not started when authority is unavailable', async () => {
    vi.mocked(loadGameState).mockReturnValue({ openAI: { apiKey: 'SENTINEL_CURRENT' } });
    vi.mocked(clearCredential).mockRejectedValueOnce(new Error('synthetic storage failure'));
    const { findByRole, findByText, findByLabelText } = render(OpenAIAPIKeySettings);
    await fireEvent.click(await findByRole('button', { name: /clear api key/i }));
    expect(
        await findByText(/clear not started. Storage authority is unavailable/i)
    ).toBeInTheDocument();
    expect(await findByLabelText(/openai api key/i)).toHaveValue('');
});

it('clears only the selected provider draft on a cross-tab notice and removes the listener', async () => {
    vi.mocked(loadGameState).mockReturnValue({ openAI: { apiKey: '' } });
    const remove = vi.spyOn(window, 'removeEventListener');
    const { findByLabelText, unmount } = render(OpenAIAPIKeySettings);
    const input = await findByLabelText(/openai api key/i);
    await fireEvent.input(input, { target: { value: 'SENTINEL_DRAFT' } });
    await fireEvent(
        window,
        new CustomEvent('dspace-credential-cleared', { detail: { kind: 'github' } })
    );
    expect(input).toHaveValue('SENTINEL_DRAFT');
    await fireEvent(
        window,
        new CustomEvent('dspace-credential-cleared', { detail: { kind: 'openAI' } })
    );
    expect(input).toHaveValue('');
    unmount();
    expect(remove).toHaveBeenCalledWith('dspace-credential-cleared', expect.any(Function));
    remove.mockRestore();
});

it.each(['storage-lock-unavailable', 'mirror-incomplete'])(
    'reports %s on Save and permits retry without claiming persistence',
    async (code) => {
        vi.mocked(loadGameState).mockReturnValue({ openAI: { apiKey: '' } });
        vi.mocked(saveCredential)
            .mockRejectedValueOnce(new Error(code))
            .mockResolvedValueOnce(undefined);
        const { findByLabelText, findByRole, findByText, queryByText } =
            render(OpenAIAPIKeySettings);
        const input = await findByLabelText(/openai api key/i);
        await fireEvent.input(input, { target: { value: 'SENTINEL_SAVE_RETRY' } });
        await fireEvent.click(await findByRole('button', { name: /save openai api key/i }));
        expect(
            await findByText(/save could not be confirmed. Check storage access and retry Save/i)
        ).toBeInTheDocument();
        expect(queryByText('OpenAI API key configured.')).not.toBeInTheDocument();
        expect(input).toHaveValue('SENTINEL_SAVE_RETRY');
        await fireEvent.click(await findByRole('button', { name: /save openai api key/i }));
        expect(await findByText('OpenAI API key saved.')).toBeInTheDocument();
    }
);
