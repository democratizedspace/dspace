import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import OpenAIChat from '../src/pages/chat/svelte/OpenAIChat.svelte';
import { activePersonaId, messages } from '../src/stores/chat.js';

const GPT35Turbo = vi.hoisted(() => vi.fn());

vi.mock('../src/utils/openAI.js', async () => {
    const actual = await vi.importActual('../src/utils/openAI.js');
    return {
        ...actual,
        GPT35Turbo,
    };
});

const sendMessage = async (text: string) => {
    const textarea = screen.getByRole('textbox');
    await fireEvent.input(textarea, { target: { value: text } });
    await fireEvent.click(screen.getByRole('button', { name: /send/i }));
};

const quotaError = () => {
    const error = new Error(
        'You exceeded your current quota, please check your plan and billing details.'
    );
    // @ts-expect-error vitest mock error extension
    error.status = 429;
    // @ts-expect-error vitest mock error extension
    error.code = 'insufficient_quota';
    // @ts-expect-error vitest mock error extension
    error.error = { message: error.message, type: 'insufficient_quota' };
    return error;
};

describe('OpenAIChat error messaging', () => {
    let consoleErrorMock: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        GPT35Turbo.mockReset();
        messages.set([]);
        activePersonaId.set('dchat');
        consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorMock.mockRestore();
    });

    it('surfaces actionable guidance when quota is exhausted', async () => {
        GPT35Turbo.mockRejectedValueOnce(quotaError());

        render(OpenAIChat);
        await sendMessage('Hello');

        await waitFor(() => expect(GPT35Turbo).toHaveBeenCalled());
        expect(await screen.findByText(/out of credits/i)).toBeInTheDocument();
        expect(await screen.findByText(/openai/i)).toBeInTheDocument();
    });

    it('surfaces invalid API key errors to the user', async () => {
        const error = new Error('Incorrect API key provided');
        // @ts-expect-error vitest mock error extension
        error.status = 401;
        GPT35Turbo.mockRejectedValueOnce(error);

        render(OpenAIChat);
        await sendMessage('Hello again');

        await waitFor(() => expect(GPT35Turbo).toHaveBeenCalled());
        expect(await screen.findByText(/api key/i)).toBeInTheDocument();
    });
});
