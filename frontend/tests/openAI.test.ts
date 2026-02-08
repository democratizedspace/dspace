import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({
        openAI: {},
    })),
    ready: Promise.resolve(),
}));

vi.mock('../src/utils/dchatKnowledge.js', () => ({
    buildDchatKnowledge: vi.fn(() => 'knowledge'),
    buildDchatKnowledgePack: vi.fn(() => ({ summary: 'knowledge', sources: [] })),
}));

vi.mock('../src/utils/docsRag.js', () => ({
    searchDocsRag: vi.fn(async () => ({
        excerptsText: '',
        sources: [],
        sourcesMeta: { results: [] },
    })),
}));

vi.mock('../src/data/npcPersonas.js', () => ({
    npcPersonas: [
        {
            id: 'dchat',
            systemPrompt: 'system prompt',
            welcomeMessage: 'hello',
        },
    ],
}));

import {
    defaultOpenAIErrorMessage,
    describeOpenAIError,
    buildChatPrompt,
    getOpenAIErrorSummary,
    GPT5Chat,
    GPT5ChatV2,
    validateChatResponseText,
} from '../src/utils/openAI.js';
import { buildDchatKnowledgePack } from '../src/utils/dchatKnowledge.js';
import { loadGameState } from '../src/utils/gameState/common.js';
import { searchDocsRag } from '../src/utils/docsRag.js';

class MockResponseClient {
    constructor(resolver) {
        this.responses = {
            create: resolver,
        };
    }
}

describe('GPT5Chat', () => {
    afterEach(() => {
        delete globalThis.__DSpaceOpenAIClient;
    });

    it('falls back to a supported model when the primary model is unavailable', async () => {
        const models = [];
        const resolver = vi.fn(async ({ model }) => {
            models.push(model);
            if (model === 'gpt-5.2') {
                const error = new Error('The model does not exist.');
                error.status = 404;
                error.error = { code: 'model_not_found' };
                throw error;
            }

            return { output_text: 'fallback response' };
        });

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(models).toEqual(['gpt-5.2', 'gpt-5-mini']);
        expect(result).toBe('fallback response');
    });

    it('attempts fallback when the primary model returns a permissioned model error', async () => {
        const models = [];
        const resolver = vi.fn(async ({ model }) => {
            models.push(model);
            if (model === 'gpt-5.2') {
                const error = new Error('model gated');
                error.status = 403;
                error.error = { code: 'model_not_found' };
                throw error;
            }

            return { output_text: 'fallback response' };
        });

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(models).toEqual(['gpt-5.2', 'gpt-5-mini']);
        expect(result).toBe('fallback response');
    });

    it('falls back when the error message indicates the model is unavailable', async () => {
        const models = [];
        const resolver = vi.fn(async ({ model }) => {
            models.push(model);
            if (model === 'gpt-5.2') {
                const error = new Error('The model gpt-5.2 does not exist for this organization.');
                error.status = 500;
                throw error;
            }

            return { output_text: 'fallback response' };
        });

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(models).toEqual(['gpt-5.2', 'gpt-5-mini']);
        expect(result).toBe('fallback response');
    });

    it('returns the primary response when the default model succeeds', async () => {
        const models = [];
        const resolver = vi.fn(async ({ model }) => {
            models.push(model);
            return { output_text: 'primary response' };
        });

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(models).toEqual(['gpt-5.2']);
        expect(result).toBe('primary response');
    });

    it('extracts output text from the content blocks when output_text is missing', async () => {
        const resolver = vi.fn(async () => ({
            output: [
                {
                    content: [
                        {
                            type: 'output_text',
                            text: 'content response',
                        },
                    ],
                },
            ],
        }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(resolver).toHaveBeenCalledTimes(1);
        expect(result).toBe('content response');
    });

    it('sends input_text content blocks in the payload', async () => {
        const resolver = vi.fn(async (payload) => {
            return {
                output_text: 'ok',
                received: payload,
            };
        });

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(resolver).toHaveBeenCalledTimes(1);
        const payload = resolver.mock.calls[0][0];
        expect(payload.input).toEqual([
            expect.objectContaining({
                role: 'system',
                content: [
                    {
                        type: 'input_text',
                        text: expect.any(String),
                    },
                ],
            }),
            expect.objectContaining({
                role: 'system',
                content: [
                    {
                        type: 'input_text',
                        text: expect.stringContaining('PlayerState v'),
                    },
                ],
            }),
            expect.objectContaining({
                role: 'system',
                content: [
                    {
                        type: 'input_text',
                        text: expect.stringContaining('DSPACE knowledge base:\nknowledge'),
                    },
                ],
            }),
            {
                role: 'user',
                content: [
                    {
                        type: 'input_text',
                        text: 'Hello',
                    },
                ],
            },
        ]);
        expect(result).toBe('ok');
    });

    it('uses output_text content blocks for assistant history entries', async () => {
        const resolver = vi.fn(async () => ({
            output_text: 'follow up',
        }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([
            { role: 'assistant', content: 'Earlier reply' },
            { role: 'user', content: 'Hello again' },
        ]);

        expect(resolver).toHaveBeenCalledTimes(1);
        const payload = resolver.mock.calls[0][0];
        expect(payload.input).toEqual(
            expect.arrayContaining([
                {
                    role: 'assistant',
                    content: [
                        {
                            type: 'output_text',
                            text: 'Earlier reply',
                        },
                    ],
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'input_text',
                            text: 'Hello again',
                        },
                    ],
                },
            ])
        );
        expect(result).toBe('follow up');
    });

    it('falls back to output content when output_text is an empty string', async () => {
        const resolver = vi.fn(async () => ({
            output_text: '   ',
            output: [
                {
                    content: [
                        {
                            type: 'output_text',
                            text: 'content response',
                        },
                    ],
                },
            ],
        }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(result).toBe('content response');
    });

    it('extracts output_text from multiple output entries', async () => {
        const resolver = vi.fn(async () => ({
            output: [
                {
                    content: [
                        {
                            type: 'image',
                            text: 'ignore me',
                        },
                    ],
                },
                {
                    content: [
                        {
                            type: 'output_text',
                            text: 'second entry response',
                        },
                    ],
                },
            ],
        }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(result).toBe('second entry response');
    });

    it('returns empty string when no output_text content is present', async () => {
        const resolver = vi.fn(async () => ({
            output: [
                {
                    content: [
                        {
                            type: 'image',
                            text: 'ignore me',
                        },
                    ],
                },
            ],
        }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(result).toBe('');
    });

    it('returns empty string when no outputs exist', async () => {
        const resolver = vi.fn(async () => ({}));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(result).toBe('');
    });

    it('surfaces unexpected OpenAI errors without retrying', async () => {
        const resolver = vi.fn(async () => {
            const error = new Error('temporary outage');
            error.status = 500;
            throw error;
        });

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        await expect(GPT5Chat([{ role: 'user', content: 'Hello' }])).rejects.toThrow(
            'temporary outage'
        );
        expect(resolver).toHaveBeenCalledTimes(1);
    });
});

describe('GPT5ChatV2', () => {
    afterEach(() => {
        delete globalThis.__DSpaceOpenAIClient;
        vi.mocked(searchDocsRag).mockClear();
    });

    it('returns contextSources for route grounding', async () => {
        vi.mocked(searchDocsRag).mockResolvedValueOnce({
            excerptsText: 'routes excerpt',
            sources: [
                {
                    type: 'route',
                    id: 'docs/routes#top',
                    label: 'Routes',
                    url: '/docs/routes#top',
                },
            ],
            sourcesMeta: { results: [] },
        });

        const resolver = vi.fn(async () => ({ output_text: 'ok' }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5ChatV2([
            { role: 'user', content: 'What are the current routes?' },
        ]);

        expect(result.text).toBe('ok');
        expect(
            result.contextSources.some(
                (entry) => entry.type === 'route' && entry.url === '/docs/routes#top'
            )
        ).toBe(true);
    });

    it('returns contextSources for changelog grounding', async () => {
        vi.mocked(searchDocsRag).mockResolvedValueOnce({
            excerptsText: 'changelog excerpt',
            sources: [
                {
                    type: 'changelog',
                    id: 'changelog/token-place',
                    label: 'Changelog',
                    url: '/changelog#token-place',
                },
            ],
            sourcesMeta: { results: [] },
        });

        const resolver = vi.fn(async () => ({ output_text: 'ok' }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5ChatV2([{ role: 'user', content: 'Is token.place active?' }]);

        expect(result.text).toBe('ok');
        expect(
            result.contextSources.some(
                (entry) => entry.type === 'changelog' && entry.url?.startsWith('/changelog#')
            )
        ).toBe(true);
    });
});

describe('buildChatPrompt', () => {
    beforeEach(() => {
        vi.mocked(buildDchatKnowledgePack).mockClear();
        vi.mocked(searchDocsRag).mockClear();
    });

    it('adds guardrails for save snapshots, clarifying questions, and anti-precision', async () => {
        const payload = await buildChatPrompt([{ role: 'user', content: 'Status?' }]);
        const systemMessage = payload.debugMessages.find(
            (message) => message.role === 'system' && message.kind === 'main'
        );
        const content = systemMessage?.content ?? '';

        expect(content).toContain('SYSTEM_POLICY_VERSION=v3.0');
        expect(content).toContain('Never invent game facts or player state.');
        expect(content).toContain('Use the PlayerState block when present.');
        expect(content).toContain('/gamesaves');
        expect(content).toContain('/docs/routes');
        expect(content).not.toContain('/docs/backups');
        expect(content).toContain('Never link to GitHub blob/tree URLs');
        expect(content).toMatch(/clarifying question/i);
        expect(content).toMatch(/only give exact counts\/durations\/rates/i);
    });

    it('does not duplicate the shared guardrail when already present', async () => {
        const systemPrompt = [
            'Custom system prompt.',
            'Never invent game facts or player state.',
            'Use the PlayerState block when present.',
            'If PlayerState is missing, ask for a save snapshot via /gamesaves and cite ' +
                '/docs/routes.',
            "If you're missing context, say you don't know and ask a clarifying question OR point " +
                'to a specific /docs page.',
            'When giving URLs/navigation, cite /docs excerpts or docs/ROUTES.md.',
            'Only give exact counts/durations/rates if they appear in retrieved context; otherwise be ' +
                "approximate or say you don't know.",
        ].join('\n');

        const payload = await buildChatPrompt([{ role: 'user', content: 'Check guardrails.' }], {
            persona: {
                id: 'custom',
                systemPrompt,
                welcomeMessage: 'hello',
            },
        });
        const systemMessage = payload.debugMessages.find(
            (message) => message.role === 'system' && message.kind === 'main'
        );
        const content = systemMessage?.content ?? '';
        const occurrences = content.match(/save snapshot/gi) ?? [];

        expect(occurrences).toHaveLength(1);
    });

    it('appends only missing guardrail lines when a persona includes some rules', async () => {
        const systemPrompt = [
            'Custom system prompt.',
            'Never invent game facts or player state.',
        ].join('\n');

        const payload = await buildChatPrompt([{ role: 'user', content: 'Check guardrails.' }], {
            persona: {
                id: 'custom',
                systemPrompt,
                welcomeMessage: 'hello',
            },
        });
        const systemMessage = payload.debugMessages.find(
            (message) => message.role === 'system' && message.kind === 'main'
        );
        const content = systemMessage?.content ?? '';
        const neverInventMatches = content.match(/never invent/gi) ?? [];

        expect(neverInventMatches).toHaveLength(1);
        expect(content).toContain('/gamesaves');
        expect(content).toMatch(/save snapshot/i);
        expect(content).toContain('/docs/routes');
        expect(content).not.toContain('/docs/backups');
    });

    it('injects PlayerState with finished quests and inventory entries', async () => {
        vi.mocked(loadGameState).mockReturnValueOnce({
            openAI: {},
            versionNumberString: '3',
            quests: {
                'welcome/howtodoquests': { finished: true },
                'welcome/intro-inventory': { finished: false },
                '3dprinter/start': { finished: true },
            },
            inventory: {
                'item-alpha': 12,
                'item-beta': 0,
                'item-gamma': 5.5,
            },
        });

        const payload = await buildChatPrompt([{ role: 'user', content: 'Status?' }]);
        const playerStateMessage = payload.debugMessages.find((message) =>
            message.content?.includes('PlayerState v3')
        );
        const content = playerStateMessage?.content ?? '';
        const jsonStart = content.indexOf('{');
        const jsonBody = jsonStart >= 0 ? content.slice(jsonStart) : '';
        const snapshot = jsonBody ? JSON.parse(jsonBody) : null;

        expect(snapshot?.versionNumberString).toBe('3');
        expect(snapshot?.questsFinished).toEqual(
            expect.arrayContaining(['welcome/howtodoquests', '3dprinter/start'])
        );
        expect(snapshot?.questsFinished).not.toEqual(
            expect.arrayContaining(['welcome/intro-inventory'])
        );
        expect(snapshot?.inventory).toEqual(
            expect.arrayContaining([
                { id: 'item-alpha', count: 12 },
                { id: 'item-gamma', count: 5.5 },
            ])
        );
        expect(payload.playerStateSummary).toEqual(
            expect.objectContaining({
                included: true,
                questsFinishedCount: 2,
                inventoryIncludedCount: 2,
                inventoryTruncated: false,
            })
        );
    });

    it('does not duplicate docs excerpts when knowledge summary exists', async () => {
        vi.mocked(buildDchatKnowledgePack).mockReturnValueOnce({
            summary: 'Summary entry',
            sources: [],
        });
        vi.mocked(searchDocsRag).mockResolvedValueOnce({
            excerptsText: `---\nDocs grounding (gitSha: test):\n- [doc] Routes — /docs/routes#top\n  sample\n---`,
            sources: [],
            sourcesMeta: { results: [] },
        });

        const payload = await buildChatPrompt([{ role: 'user', content: 'Routes?' }]);
        const ragMessages = payload.debugMessages.filter((message) => message.kind === 'rag');
        const debugContent = payload.debugMessages.map((message) => message.content).join('\n');
        const combinedContent = payload.combinedMessages
            .map((message) => message.content)
            .join('\n');

        expect(ragMessages).toHaveLength(1);
        const ragContent = ragMessages[0].content;
        const ragMatches = ragContent.match(/Docs grounding/g) || [];
        expect(ragMatches).toHaveLength(1);
        const debugMatches = debugContent.match(/Docs grounding/g) || [];
        expect(debugMatches).toHaveLength(1);
        const combinedMatches = combinedContent.match(/Docs grounding/g) || [];
        expect(combinedMatches).toHaveLength(1);
        expect(ragContent).toContain('DSPACE knowledge base:');
        expect(combinedContent).toContain('DSPACE knowledge base:');
        expect(buildDchatKnowledgePack).toHaveBeenCalled();
    });

    it('expands docs retrieval queries for vague follow-ups with capped context', async () => {
        const longUserDetail = 'Details about crafting a rocket. '.repeat(30);
        const longAssistantDetail = 'Step guidance for the build. '.repeat(30);
        vi.mocked(searchDocsRag).mockResolvedValueOnce({
            excerptsText: '',
            sources: [],
            sourcesMeta: { results: [] },
        });
        const messages = [
            {
                role: 'user',
                content: `How do I craft a rocket in DSPACE? ${longUserDetail}`,
            },
            {
                role: 'assistant',
                content: `You start by gathering materials. ${longAssistantDetail}`,
            },
            {
                role: 'user',
                content: 'what about the second step?',
            },
        ];

        await buildChatPrompt(messages);

        const retrievalQuery = vi.mocked(searchDocsRag).mock.calls[0][0];

        expect(retrievalQuery).toContain('what about the second step?');
        expect(retrievalQuery).toContain('How do I craft a rocket in DSPACE?');
        expect(retrievalQuery).toContain('You start by gathering materials.');
        expect(retrievalQuery).toContain('Previous context:');
        const contextBlock = retrievalQuery.split('Previous context:')[1]?.trim() ?? '';
        expect(contextBlock.length).toBeLessThanOrEqual(800);
        expect(retrievalQuery.length).toBeLessThanOrEqual(1000);
    });

    it('keeps docs retrieval queries unchanged for non-vague prompts', async () => {
        const latestMessage =
            'Can you explain the full process for crafting a rocket, including materials and steps?';
        vi.mocked(searchDocsRag).mockResolvedValueOnce({
            excerptsText: '',
            sources: [],
            sourcesMeta: { results: [] },
        });
        const messages = [
            {
                role: 'user',
                content: 'Any tips for early quests?',
            },
            {
                role: 'assistant',
                content: 'Start with the tutorial quest.',
            },
            {
                role: 'user',
                content: latestMessage,
            },
        ];

        await buildChatPrompt(messages);

        const retrievalQuery = vi.mocked(searchDocsRag).mock.calls[0][0];

        expect(retrievalQuery).toBe(latestMessage);
    });

    it('keeps short, self-contained questions unchanged', async () => {
        const latestMessage = 'Where is /gamesaves?';
        const messages = [
            {
                role: 'user',
                content: 'Tell me about quests.',
            },
            {
                role: 'assistant',
                content: 'Quests guide you through tasks.',
            },
            {
                role: 'user',
                content: latestMessage,
            },
        ];

        await buildChatPrompt(messages);

        const retrievalQuery = vi.mocked(searchDocsRag).mock.calls[0][0];

        expect(retrievalQuery).toBe(latestMessage);
    });

    it('passes expanded docs RAG options to searchDocsRag', async () => {
        const messages = [{ role: 'user', content: 'Tell me about quests.' }];

        await buildChatPrompt(messages, { docsRagBudgetChars: 1000000 });

        const [, options] = vi.mocked(searchDocsRag).mock.calls[0];

        expect(options).toEqual(
            expect.objectContaining({
                maxResults: 50,
                maxChars: 50000,
                maxExcerptChars: 8500,
            })
        );
    });

    it('clamps docs RAG maxChars when the prompt budget is exhausted', async () => {
        const messages = [{ role: 'user', content: 'Need docs.' }];

        await buildChatPrompt(messages, { docsRagBudgetChars: 0 });

        const [, options] = vi.mocked(searchDocsRag).mock.calls[0];

        expect(options.maxChars).toBe(0);
    });
});

describe('validateChatResponseText', () => {
    it('rewrites GitHub docs blob links to in-game /docs routes', () => {
        const result = validateChatResponseText(
            'See https://github.com/democratizedspace/dspace/blob/main/docs/ROUTES.md and ' +
                'https://github.com/democratizedspace/dspace/blob/main/frontend/src/pages/docs/md/v3-release-state.md.'
        );

        expect(result.wasSanitized).toBe(true);
        expect(result.text).toContain('/docs/routes');
        expect(result.text).toContain('/docs/v3-release-state');
        expect(result.text).not.toMatch(/\/blob\//i);
        expect(result.text).not.toMatch(/\/tree\//i);
    });

    it('strips GitHub blob links while keeping the response body intact', () => {
        const result = validateChatResponseText(
            'Reference ' +
                'https://github.com/democratizedspace/dspace/blob/main/docs/design/rag_discoverability.md ' +
                'but keep this sentence.'
        );

        expect(result.wasSanitized).toBe(true);
        expect(result.text).toContain('keep this sentence');
        expect(result.text).toContain('[link removed: use /docs routes]');
        expect(result.text).not.toMatch(/\/blob\//i);
    });

    it('sanitizes GitHub blob links even when context sources exist', () => {
        const result = validateChatResponseText(
            'See https://github.com/democratizedspace/dspace/blob/main/docs/ROUTES.md.',
            { contextSources: [{ type: 'doc', url: '/docs/routes' }] }
        );

        expect(result.wasSanitized).toBe(true);
        expect(result.text).toContain('/docs/routes');
    });
});

describe('describeOpenAIError', () => {
    it('returns a quota message when OpenAI rejects for insufficient credits', () => {
        const error = new Error(
            'You exceeded your current quota, please check your plan and billing details.'
        );
        error.status = 429;
        error.code = 'insufficient_quota';
        error.error = { message: error.message, type: 'insufficient_quota' };

        const result = describeOpenAIError(error);

        expect(result).toMatch(/out of credits/i);
        expect(result).toMatch(/openai/i);
    });

    it('returns an API key message for authentication failures', () => {
        const error = new Error('Incorrect API key provided');
        error.status = 401;

        const result = describeOpenAIError(error);

        expect(result).toMatch(/api key/i);
        expect(result).toMatch(/openai/i);
    });

    it('treats numeric status strings as server errors', () => {
        const error = new Error('internal server error');
        // @ts-expect-error testing string coercion
        error.status = '503';

        const result = describeOpenAIError(error);

        expect(result).toMatch(/unavailable/i);
    });

    it('falls back to the default message for unknown errors', () => {
        const result = describeOpenAIError(new Error('unexpected'));

        expect(result).toBe(defaultOpenAIErrorMessage);
    });
});

describe('getOpenAIErrorSummary', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('labels authentication failures as auth errors', () => {
        const error = new Error('Invalid API key');
        error.status = 401;

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('auth');
        expect(result.message).toMatch(/api key/i);
    });

    it('labels quota exhaustion as quota errors', () => {
        const error = new Error('You exceeded your current quota');
        error.status = 429;
        error.code = 'insufficient_quota';
        error.error = { type: 'insufficient_quota' };

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('quota');
        expect(result.message).toMatch(/out of credits/i);
    });

    it('labels rate limiting as rate limit errors', () => {
        const error = new Error('Rate limit exceeded');
        error.status = 429;

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('rate_limit');
        expect(result.message).toMatch(/rate limited/i);
    });

    it('labels model access failures as permission errors', () => {
        const error = new Error('The model does not exist');
        error.status = 404;
        error.code = 'model_not_found';

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('permission');
        expect(result.message).toMatch(/denied access/i);
    });

    it('labels server outages as server errors', () => {
        const error = new Error('Server error');
        error.status = 503;

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('server');
        expect(result.message).toMatch(/unavailable/i);
    });

    it('labels offline failures as network errors', () => {
        vi.stubGlobal('navigator', { onLine: false });
        const error = new Error('Failed to fetch');

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('network');
        expect(result.message).toMatch(/could not reach/i);
    });

    it('labels network errors when the error name indicates a network failure', () => {
        const error = new Error('Request failed');
        error.name = 'NetworkError';

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('network');
        expect(result.message).toMatch(/could not reach/i);
    });

    it('labels network errors when the message contains load failed', () => {
        const error = new Error('Load failed while fetching the resource.');

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('network');
        expect(result.message).toMatch(/could not reach/i);
    });

    it('labels network errors when the message contains networkerror', () => {
        const error = new Error('NetworkError when attempting to fetch resource.');

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('network');
        expect(result.message).toMatch(/could not reach/i);
    });

    it('labels empty TypeError failures as network errors', () => {
        const error = new Error('');
        error.name = 'TypeError';

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('network');
        expect(result.message).toMatch(/could not reach/i);
    });

    it('falls back to unknown for unexpected errors', () => {
        const result = getOpenAIErrorSummary(new Error('mystery'));

        expect(result.type).toBe('unknown');
        expect(result.message).toBe(defaultOpenAIErrorMessage);
    });
});
