import { beforeEach, describe, expect, it, vi } from 'vitest';

const createChatCompletionMock = vi.fn().mockResolvedValue({
    choices: [{ message: { content: 'mocked reply' } }],
});

vi.mock('openai', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            chat: { completions: { create: createChatCompletionMock } },
        })),
    };
});

vi.mock('../frontend/src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({ openAI: { apiKey: 'test-key' } })),
    ready: Promise.resolve(),
}));

describe('GPT35Turbo persona integration', () => {
    beforeEach(() => {
        createChatCompletionMock.mockClear();
    });

    it('injects persona-specific prompt and welcome message', async () => {
        const { GPT35Turbo } = await import('../frontend/src/utils/openAI.js');
        const chatStore = await import('../frontend/src/stores/chat.js');
        const persona = chatStore.personaOptions?.find((p) => p.id === 'sydney');
        expect(persona, 'expected a Sydney persona to be defined').toBeTruthy();

        await GPT35Turbo([], { persona });

        expect(createChatCompletionMock).toHaveBeenCalledTimes(1);
        const call = createChatCompletionMock.mock.calls[0][0];
        expect(call.messages[0].content).toContain('Sydney');
        expect(call.messages[2].content).toContain(persona.welcomeMessage);
    });
});
