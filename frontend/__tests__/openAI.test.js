const { vi } = require('vitest');
const jest = vi;

const createResponseMock = jest.fn().mockResolvedValue({
    output: [
        {
            id: 'msg_1',
            type: 'message',
            role: 'assistant',
            content: [
                {
                    type: 'output_text',
                    text: 'mocked reply',
                },
            ],
        },
    ],
    output_text: 'mocked reply',
});

jest.mock('openai', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(function () {
            this.responses = { create: createResponseMock };
        }),
    };
});

jest.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: jest.fn(() => ({ openAI: { apiKey: 'test-key' } })),
    ready: Promise.resolve(),
}));

const { GPT35Turbo } = require('../src/utils/openAI.js');

describe('gpt-5 chat responses utility', () => {
    beforeEach(() => {
        createResponseMock.mockClear();
    });

    test('uses opening message and knowledge when no messages provided', async () => {
        await GPT35Turbo([]);
        expect(createResponseMock).toHaveBeenCalledTimes(1);
        const call = createResponseMock.mock.calls[0][0];
        expect(call.model).toBe('gpt-5-chat-latest');
        expect(call.input[0].role).toBe('system');
        expect(call.input[0].content[0].text).toContain('GPT-5');
        expect(call.input[1]).toEqual(
            expect.objectContaining({
                role: 'system',
                content: [
                    expect.objectContaining({
                        type: 'text',
                        text: expect.stringContaining('DSPACE knowledge base:'),
                    }),
                ],
            })
        );
        expect(call.input[1].content[0].text).toContain('white PLA filament');
        expect(call.input[1].content[0].text).toContain('How to do quests');
        expect(call.input[2]).toEqual({
            role: 'assistant',
            content: [
                {
                    type: 'text',
                    text: 'Welcome! How can I assist you today?',
                },
            ],
        });
    });

    test('prepends system message when messages supplied', async () => {
        await GPT35Turbo([{ role: 'user', content: 'hello' }]);
        const call = createResponseMock.mock.calls[0][0];
        expect(call.input[0]).toEqual(expect.objectContaining({ role: 'system' }));
        expect(call.input[1]).toEqual(
            expect.objectContaining({
                role: 'system',
                content: [
                    expect.objectContaining({
                        type: 'text',
                        text: expect.stringContaining('DSPACE knowledge base:'),
                    }),
                ],
            })
        );
        expect(call.input[2]).toEqual({
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: 'hello',
                },
            ],
        });
    });

    test('returns response content', async () => {
        const result = await GPT35Turbo([]);
        expect(result).toBe('mocked reply');
    });
});
