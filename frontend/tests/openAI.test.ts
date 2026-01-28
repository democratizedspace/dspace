import { describe, it, expect, afterEach, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({
        openAI: {},
    })),
    ready: Promise.resolve(),
}));

vi.mock('../src/utils/dchatKnowledge.js', () => ({
    buildDchatKnowledge: vi.fn(() => 'knowledge'),
}));

vi.mock('../src/utils/docsRag.js', () => ({
    searchDocsRag: vi.fn(async () => ({ excerptsText: '', sourcesMeta: { sources: [] } })),
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
    getOpenAIErrorSummary,
    GPT5Chat,
} from '../src/utils/openAI.js';

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
                        text: expect.stringContaining('Never invent quests'),
                    },
                ],
            }),
            expect.objectContaining({
                role: 'system',
                content: [
                    {
                        type: 'input_text',
                        text: expect.stringContaining('knowledge'),
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
