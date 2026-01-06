import { render, fireEvent } from '@testing-library/svelte';
import { afterEach, vi } from 'vitest';
import OpenAIChat from '../src/pages/chat/svelte/OpenAIChat.svelte';

const quotaError = new Error(
    'Ym: 429 You exceeded your current quota, please check your plan and billing details.'
);
quotaError.status = 429;

vi.mock('../src/utils/openAI.js', async () => {
    const actual = await vi.importActual('../src/utils/openAI.js');
    return {
        ...actual,
        GPT35Turbo: vi.fn(async () => {
            throw quotaError;
        }),
    };
});

describe('OpenAIChat error handling', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows a human-readable quota message when OpenAI rejects with 429', async () => {
        const { getByRole, findByText } = render(OpenAIChat);
        const textarea = getByRole('textbox');
        const sendButton = getByRole('button', { name: /send/i });

        vi.spyOn(console, 'error').mockImplementation(() => {});

        await fireEvent.input(textarea, { target: { value: 'Hello' } });
        await fireEvent.click(sendButton);

        const expectedMessage =
            'OpenAI reports your account is out of credits. Add billing or wait for your quota to reset, then try again.';

        const assistantMessage = await findByText(expectedMessage);
        expect(assistantMessage?.textContent).toContain('out of credits');
    });
});
