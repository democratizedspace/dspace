import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { messages } from '../../../../stores/chat.js';

vi.mock('../../../../utils/openAI.js', () => {
    const GPT35Turbo = vi.fn();
    return { GPT35Turbo };
});

import OpenAIChat from '../OpenAIChat.svelte';
import { GPT35Turbo } from '../../../../utils/openAI.js';

const fallbackText = "Sorry, I'm having some trouble and can't generate a response.";

describe('OpenAIChat error handling', () => {
    const mockedGPT35Turbo = GPT35Turbo as vi.Mock;

    beforeEach(() => {
        messages.set([]);
        vi.clearAllMocks();
    });

    it('surfaces a user-facing message on network failures', async () => {
        mockedGPT35Turbo.mockRejectedValue(new Error('network down'));

        const { getByRole, findByText } = render(OpenAIChat);
        const input = getByRole('textbox');

        await fireEvent.input(input, { target: { value: 'Hello there' } });
        await fireEvent.click(getByRole('button', { name: 'Send' }));

        await findByText(fallbackText);
        await waitFor(() => expect(mockedGPT35Turbo).toHaveBeenCalled());
    });

    it('handles provider/rate-limit errors with the same fallback', async () => {
        const rateLimitError = Object.assign(new Error('rate limit'), { status: 429 });
        mockedGPT35Turbo.mockRejectedValue(rateLimitError);

        const { getByRole, findByText } = render(OpenAIChat);
        const input = getByRole('textbox');

        await fireEvent.input(input, { target: { value: 'Need help' } });
        await fireEvent.click(getByRole('button', { name: 'Send' }));

        await findByText(fallbackText);
        await waitFor(() => expect(mockedGPT35Turbo).toHaveBeenCalled());
    });
});
