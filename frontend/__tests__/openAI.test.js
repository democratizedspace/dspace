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

const mockedState = {
    quests: {
        'welcome/howtodoquests': { stepId: 2 },
        'welcome/intro-inventory': { finished: true },
    },
    processes: {
        'outlet-dWatt-1e3': {
            startedAt: 0,
            duration: 2000,
            elapsedBeforePause: 0,
        },
    },
    inventory: {
        '58580f6f-f3be-4be0-80b9-f6f8bf0b05a6': 2,
    },
};

jest.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: jest.fn(() => mockedState),
    ready: Promise.resolve(),
}));

jest.mock('../src/utils/docsRag.js', () => ({
    searchDocsRag: jest.fn(async () => ({ excerptsText: '', sourcesMeta: { results: [] } })),
}));

const { searchDocsRag } = require('../src/utils/docsRag.js');
const { buildChatPrompt, GPT5Chat } = require('../src/utils/openAI.js');

describe('gpt-5 chat responses utility', () => {
    beforeEach(() => {
        createResponseMock.mockClear();
    });

    test('uses opening message and knowledge when no messages provided', async () => {
        await GPT5Chat([]);
        expect(createResponseMock).toHaveBeenCalledTimes(1);
        const call = createResponseMock.mock.calls[0][0];
        expect(call.model).toBe('gpt-5.2');
        expect(call.input[0].role).toBe('system');
        expect(call.input[0].content[0].text).toContain('GPT-5');
        expect(call.input[1]).toEqual(
            expect.objectContaining({
                role: 'system',
                content: [
                    expect.objectContaining({
                        type: 'input_text',
                        text: expect.stringContaining('DSPACE knowledge base:'),
                    }),
                ],
            })
        );
        expect(call.input[1].content[0].text).toContain('white PLA filament');
        expect(call.input[1].content[0].text).toContain('How to do quests');
        expect(call.input[1].content[0].text).toContain('Quest progress');
        expect(call.input[1].content[0].text).toContain('Processes in flight');
        expect(call.input[2]).toEqual({
            role: 'assistant',
            content: [
                {
                    type: 'output_text',
                    text: 'Welcome! How can I assist you today?',
                },
            ],
        });
    });

    test('prepends system message when messages supplied', async () => {
        await GPT5Chat([{ role: 'user', content: 'hello' }]);
        const call = createResponseMock.mock.calls[0][0];
        expect(call.input[0]).toEqual(expect.objectContaining({ role: 'system' }));
        expect(call.input[1]).toEqual(
            expect.objectContaining({
                role: 'system',
                content: [
                    expect.objectContaining({
                        type: 'input_text',
                        text: expect.stringContaining('DSPACE knowledge base:'),
                    }),
                ],
            })
        );
        expect(call.input[2]).toEqual({
            role: 'user',
            content: [
                {
                    type: 'input_text',
                    text: 'hello',
                },
            ],
        });
    });

    test('returns response content', async () => {
        const result = await GPT5Chat([]);
        expect(result).toBe('mocked reply');
    });

    test('buildChatPrompt labels RAG content for debug', async () => {
        const { debugMessages } = await buildChatPrompt([]);
        const ragMessages = debugMessages.filter((message) => message.kind === 'rag');
        expect(ragMessages).toHaveLength(1);
        expect(ragMessages[0].content).toContain('DSPACE knowledge base:');
    });

    test('buildChatPrompt does not duplicate docs excerpts when knowledge exists', async () => {
        searchDocsRag.mockResolvedValueOnce({
            excerptsText: [
                '---',
                'Docs grounding (gitSha: abc123):',
                '- [route] Routes — /docs/routes#top',
                '---',
            ].join('\n'),
            sources: [
                {
                    type: 'route',
                    id: 'route:/docs/routes#top',
                    label: 'Routes',
                    url: '/docs/routes#top',
                },
            ],
            sourcesMeta: { results: [] },
        });

        const { debugMessages } = await buildChatPrompt([
            { role: 'user', content: 'What are the routes?' },
        ]);
        const combinedText = debugMessages.map((message) => message.content).join('\n');
        const occurrences = combinedText.match(/Docs grounding/gi) ?? [];
        expect(occurrences).toHaveLength(1);
        expect(
            debugMessages.filter(
                (message) => message.kind === 'rag' && message.content.includes('Docs grounding')
            )
        ).toHaveLength(1);
    });
});
