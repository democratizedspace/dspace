import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({
        openAI: {},
        settings: {
            showChatDebugPayload: false,
            showQuestGraphVisualizer: false,
        },
    })),
    ready: Promise.resolve(),
    state: {
        subscribe: vi.fn(() => () => {}),
    },
}));

vi.mock('../src/utils/dchatKnowledge.js', () => ({
    buildDchatKnowledge: vi.fn(() => 'knowledge'),
}));

vi.mock('../src/data/npcPersonas.js', () => ({
    npcPersonas: [
        {
            id: 'dchat',
            name: 'D-Chat',
            avatar: '',
            systemPrompt: 'system prompt',
            welcomeMessage: 'hello',
            summary: 'summary',
        },
    ],
}));

const GPT5Chat = vi.hoisted(() => vi.fn());

vi.mock('../src/utils/openAI.js', async () => {
    const actual = await vi.importActual('../src/utils/openAI.js');
    return {
        ...actual,
        GPT5Chat,
    };
});

import OpenAIChat from '../src/pages/chat/svelte/OpenAIChat.svelte';
import { activePersonaId, messages } from '../src/stores/chat.js';

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
        GPT5Chat.mockReset();
        messages.set([]);
        activePersonaId.set('dchat');
        consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorMock.mockRestore();
    });

    it('surfaces actionable guidance when quota is exhausted', async () => {
        GPT5Chat.mockRejectedValueOnce(quotaError());

        render(OpenAIChat);
        await sendMessage('Hello');

        await waitFor(() => expect(GPT5Chat).toHaveBeenCalled());
        const banner = await screen.findByRole('alert');
        expect(banner.getAttribute('data-error-type')).toBe('quota');
        expect(banner.textContent).toMatch(/out of credits/i);
        expect(
            await screen.findAllByText(/openai could not generate a reply because this account/i)
        ).toHaveLength(2);
    });

    it('surfaces invalid API key errors to the user', async () => {
        const error = new Error('Incorrect API key provided');
        // @ts-expect-error vitest mock error extension
        error.status = 401;
        GPT5Chat.mockRejectedValueOnce(error);

        render(OpenAIChat);
        await sendMessage('Hello again');

        await waitFor(() => expect(GPT5Chat).toHaveBeenCalled());
        const banner = await screen.findByRole('alert');
        expect(banner.getAttribute('data-error-type')).toBe('auth');
        expect(await screen.findAllByText(/api key/i)).toHaveLength(2);
    });
});
