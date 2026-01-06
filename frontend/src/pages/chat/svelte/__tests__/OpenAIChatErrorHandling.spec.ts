import { render, screen, fireEvent } from '@testing-library/svelte';
import { toBeInTheDocument } from '@testing-library/jest-dom/matchers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OpenAIChat from '../OpenAIChat.svelte';
import { GPT35Turbo } from '../../../../utils/openAI.js';

expect.extend({ toBeInTheDocument });

vi.mock('../../../../utils/openAI.js', () => ({
    GPT35Turbo: vi.fn(),
}));

describe('OpenAIChat error handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a user-friendly message when the request fails', async () => {
        GPT35Turbo.mockRejectedValueOnce(new Error('Network failed'));

        render(OpenAIChat);

        const input = screen.getByRole('textbox');
        await fireEvent.input(input, { target: { value: 'Hello there' } });
        await fireEvent.click(screen.getByRole('button', { name: /send/i }));

        expect(
            await screen.findByText("Sorry, I'm having some trouble and can't generate a response.")
        ).toBeInTheDocument();
    });
});
