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

vi.mock('../src/data/npcPersonas.js', () => ({
    npcPersonas: [
        {
            id: 'dchat',
            systemPrompt: 'system prompt',
            welcomeMessage: 'hello',
        },
    ],
}));

import { GPT35Turbo, describeOpenAIError } from '../src/utils/openAI.js';

class MockResponseClient {
    constructor(resolver) {
        this.responses = {
            create: resolver,
        };
    }
}

describe('GPT35Turbo', () => {
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

        const result = await GPT35Turbo([{ role: 'user', content: 'Hello' }]);

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

        const result = await GPT35Turbo([{ role: 'user', content: 'Hello' }]);

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

        const result = await GPT35Turbo([{ role: 'user', content: 'Hello' }]);

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

        const result = await GPT35Turbo([{ role: 'user', content: 'Hello' }]);

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

        const result = await GPT35Turbo([{ role: 'user', content: 'Hello' }]);

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

        const result = await GPT35Turbo([{ role: 'user', content: 'Hello' }]);

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

        const result = await GPT35Turbo([
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

        const result = await GPT35Turbo([{ role: 'user', content: 'Hello' }]);

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

        const result = await GPT35Turbo([{ role: 'user', content: 'Hello' }]);

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

        const result = await GPT35Turbo([{ role: 'user', content: 'Hello' }]);

        expect(result).toBe('');
    });

    it('returns empty string when no outputs exist', async () => {
        const resolver = vi.fn(async () => ({}));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT35Turbo([{ role: 'user', content: 'Hello' }]);

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

        await expect(GPT35Turbo([{ role: 'user', content: 'Hello' }])).rejects.toThrow(
            'temporary outage'
        );
        expect(resolver).toHaveBeenCalledTimes(1);
    });
});

describe('describeOpenAIError', () => {
    it('returns a quota guidance when billing credits are exhausted', () => {
        const error = {
            status: 429,
            error: {
                code: 'insufficient_quota',
                message: 'You exceeded your current quota',
            },
        };

        expect(describeOpenAIError(error)).toContain('billing credits are exhausted');
    });

    it('returns an invalid key message for bad credentials', () => {
        const error = {
            status: 401,
            error: { code: 'invalid_api_key', message: 'Invalid API key provided' },
        };

        expect(describeOpenAIError(error)).toContain('looks invalid');
    });

    it('returns a rate limit message for throttle errors', () => {
        const error = { status: 429, message: 'Rate limit exceeded' };

        expect(describeOpenAIError(error)).toContain('rate limiting');
    });

    it('returns a server unavailable message for 5xx errors', () => {
        const error = { status: 503, message: 'Temporary outage' };

        expect(describeOpenAIError(error)).toContain('currently unavailable');
    });

    it('returns a connectivity message for network errors', () => {
        const error = { message: 'Network error fetching response' };

        expect(describeOpenAIError(error)).toContain('could not reach OpenAI');
    });

    it('falls back to a default message for unknown errors', () => {
        const error = { message: 'unexpected' };

        expect(describeOpenAIError(error)).toContain("can't generate a response");
    });
});
