import { beforeEach, describe, expect, it, vi } from 'vitest';

const responsesCreateMock = vi.fn().mockResolvedValue({ output_text: 'mocked reply' });

vi.mock('openai', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            responses: { create: responsesCreateMock },
        })),
    };
});

vi.mock('../frontend/src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({ openAI: { apiKey: 'test-key' } })),
    ready: Promise.resolve(),
}));

describe('GPT35Turbo persona integration', () => {
    beforeEach(() => {
        responsesCreateMock.mockClear();
    });

    it('injects persona-specific prompt and welcome message', async () => {
        const { GPT35Turbo } = await import('../frontend/src/utils/openAI.js');
        const chatStore = await import('../frontend/src/stores/chat.js');
        const persona = chatStore.personaOptions?.find((p) => p.id === 'sydney');
        expect(persona, 'expected a Sydney persona to be defined').toBeTruthy();

        await GPT35Turbo([], { persona });

        expect(responsesCreateMock).toHaveBeenCalledTimes(1);
        const call = responsesCreateMock.mock.calls[0][0];
        expect(call.model).toBe('gpt-5-chat-latest');
        expect(call.input[0].content[0].text).toContain('Sydney');
        const lastMessage = call.input.at(-1);
        expect(lastMessage?.role).toBe('assistant');
        expect(lastMessage?.content?.[0]?.text).toContain(persona.welcomeMessage);
    });
});
