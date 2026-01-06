import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGPT35Turbo = vi.hoisted(() => vi.fn());

vi.mock('../../../../utils/openAI.js', () => ({
    GPT35Turbo: mockGPT35Turbo,
}));

import OpenAIChat from '../OpenAIChat.svelte';

const FALLBACK_TEXT = "Sorry, I'm having some trouble and can't generate a response.";

describe('OpenAIChat error handling', () => {
    beforeEach(() => {
        mockGPT35Turbo.mockReset();
    });

    const renderAndSendMessage = async () => {
        render(OpenAIChat);

        const panel = screen.getByTestId('chat-panel');
        await waitFor(() => expect(panel).toHaveAttribute('data-hydrated', 'true'));

        const textarea = screen.getByRole('textbox');
        await userEvent.type(textarea, 'Hello from tests');
        await userEvent.click(screen.getByRole('button', { name: /send/i }));

        return panel;
    };

    it('shows a user-facing message when the network request fails', async () => {
        mockGPT35Turbo.mockRejectedValue(new Error('Network offline'));

        const panel = await renderAndSendMessage();

        await screen.findByText(FALLBACK_TEXT);
        const spinner = panel.querySelector('.spinner-container');
        expect(spinner).not.toBeNull();
        await waitFor(() => expect(spinner).not.toBeVisible());
        expect(mockGPT35Turbo).toHaveBeenCalledTimes(1);
    });

    it('surfaces provider errors (e.g., rate limits) with the fallback message', async () => {
        mockGPT35Turbo.mockRejectedValue({ status: 429, message: 'Rate limited' });

        const panel = await renderAndSendMessage();

        await screen.findByText(FALLBACK_TEXT);
        const spinner = panel.querySelector('.spinner-container');
        expect(spinner).not.toBeNull();
        await waitFor(() => expect(spinner).not.toBeVisible());
        expect(mockGPT35Turbo).toHaveBeenCalledTimes(1);
    });
});
