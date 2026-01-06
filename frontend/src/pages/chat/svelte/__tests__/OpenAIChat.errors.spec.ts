import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import OpenAIChat from '../OpenAIChat.svelte';

vi.mock('../../../../utils/openAI.js', () => {
    return {
        GPT35Turbo: vi.fn(() => {
            const error: any = new Error('You exceeded your current quota');
            error.status = 429;
            error.error = { code: 'insufficient_quota' };
            return Promise.reject(error);
        }),
        describeOpenAIError: vi.fn(() => 'OpenAI billing credits are exhausted for this key.'),
    };
});

describe('OpenAIChat error handling', () => {
    it('shows a friendly quota error and surfaces it in chat', async () => {
        render(OpenAIChat);

        const textarea = screen.getByRole('textbox');
        await userEvent.type(textarea, 'Hello');
        await userEvent.click(screen.getByRole('button', { name: /send/i }));

        const occurrences = await screen.findAllByText(/billing credits are exhausted/i);

        expect(occurrences.length).toBeGreaterThan(0);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });
});
