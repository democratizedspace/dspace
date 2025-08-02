const { vi } = require('vitest');
const jest = vi;

const createChatCompletionMock = jest.fn().mockResolvedValue({
    data: { choices: [{ message: { content: 'mocked reply' } }] },
});

jest.mock('openai', () => {
    return {
        __esModule: true,
        Configuration: jest.fn(),
        OpenAIApi: jest.fn().mockImplementation(function () {
            this.createChatCompletion = createChatCompletionMock;
        }),
    };
});

jest.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: jest.fn(() => ({ openAI: { apiKey: 'test-key' } })),
}));

const { GPT35Turbo } = require('../src/utils/openAI.js');

describe('GPT35Turbo', () => {
    beforeEach(() => {
        createChatCompletionMock.mockClear();
    });

    test('uses opening message when no messages provided', async () => {
        await GPT35Turbo([]);
        expect(createChatCompletionMock).toHaveBeenCalledTimes(1);
        const call = createChatCompletionMock.mock.calls[0][0];
        expect(call.model).toBe('gpt-3.5-turbo');
        expect(call.messages[0].role).toBe('system');
        expect(call.messages[1].role).toBe('assistant');
    });

    test('prepends system message when messages supplied', async () => {
        await GPT35Turbo([{ role: 'user', content: 'hello' }]);
        const call = createChatCompletionMock.mock.calls[0][0];
        expect(call.messages).toEqual([
            expect.objectContaining({ role: 'system' }),
            { role: 'user', content: 'hello' },
        ]);
    });

    test('returns response content', async () => {
        const result = await GPT35Turbo([]);
        expect(result).toBe('mocked reply');
    });
});
