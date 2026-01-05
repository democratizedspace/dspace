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

import { GPT35Turbo } from '../src/utils/openAI.js';

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

    it('sends assistant history as output_text blocks', async () => {
        const resolver = vi.fn(async (payload) => ({
            output_text: 'ok',
            received: payload,
        }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        await GPT35Turbo([
            { role: 'assistant', content: 'Earlier reply' },
            { role: 'user', content: 'Follow-up question' },
        ]);

        const payload = resolver.mock.calls[0][0];
        const assistantEntry = payload.input.find((entry) => entry.role === 'assistant');
        const userEntry = payload.input.find((entry) => entry.role === 'user');

        expect(assistantEntry).toEqual({
            role: 'assistant',
            content: [
                {
                    type: 'output_text',
                    text: 'Earlier reply',
                },
            ],
        });
        expect(userEntry).toEqual({
            role: 'user',
            content: [
                {
                    type: 'input_text',
                    text: 'Follow-up question',
                },
            ],
        });
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
