const { vi } = require('vitest');
const jest = vi;

const createChatCompletionMock = jest.fn().mockResolvedValue({
    choices: [{ message: { content: 'mocked reply' } }],
});

jest.mock('openai', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(function () {
            this.chat = { completions: { create: createChatCompletionMock } };
        }),
    };
});

jest.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: jest.fn(() => ({ openAI: { apiKey: 'test-key' } })),
    ready: Promise.resolve(),
}));

const { GPT35Turbo } = require('../src/utils/openAI.js');

describe('GPT35Turbo', () => {
    beforeEach(() => {
        createChatCompletionMock.mockClear();
    });

    test('uses opening message and knowledge when no messages provided', async () => {
        await GPT35Turbo([]);
        expect(createChatCompletionMock).toHaveBeenCalledTimes(1);
        const call = createChatCompletionMock.mock.calls[0][0];
        expect(call.model).toBe('gpt-3.5-turbo');
        expect(call.messages[0].role).toBe('system');
        expect(call.messages[1]).toEqual(
            expect.objectContaining({
                role: 'system',
                content: expect.stringContaining('DSPACE knowledge base:'),
            })
        );
        expect(call.messages[1].content).toContain('white PLA filament');
        expect(call.messages[1].content).toContain('How to do quests');
        expect(call.messages[2].role).toBe('assistant');
    });

    test('prepends system message when messages supplied', async () => {
        await GPT35Turbo([{ role: 'user', content: 'hello' }]);
        const call = createChatCompletionMock.mock.calls[0][0];
        expect(call.messages[0]).toEqual(expect.objectContaining({ role: 'system' }));
        expect(call.messages[1]).toEqual(
            expect.objectContaining({
                role: 'system',
                content: expect.stringContaining('DSPACE knowledge base:'),
            })
        );
        expect(call.messages[2]).toEqual({ role: 'user', content: 'hello' });
    });

    test('returns response content', async () => {
        const result = await GPT35Turbo([]);
        expect(result).toBe('mocked reply');
    });
});
