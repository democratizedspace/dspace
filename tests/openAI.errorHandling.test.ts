import { describe, expect, it, vi } from 'vitest';

vi.mock('openai', () => ({
    default: vi.fn(),
}));

describe('OpenAI error handling', () => {
    it('surfaces invalid API key errors', async () => {
        const { getOpenAIErrorSummary } = await import('../frontend/src/utils/openAI.js');
        const error = { status: 401 };

        expect(getOpenAIErrorSummary(error)).toEqual({
            type: 'auth',
            message: 'OpenAI rejected your API key. Update your key in Settings and try again.',
        });
    });

    it('distinguishes rate limit and quota errors', async () => {
        const { getOpenAIErrorSummary } = await import('../frontend/src/utils/openAI.js');
        const rateLimit = { status: 429, message: 'Rate limit exceeded' };
        const quota = { status: 429, code: 'insufficient_quota' };

        expect(getOpenAIErrorSummary(rateLimit).type).toBe('rate_limit');
        expect(getOpenAIErrorSummary(quota).type).toBe('quota');
    });

    it('flags model access and permission errors', async () => {
        const { getOpenAIErrorSummary } = await import('../frontend/src/utils/openAI.js');
        const modelMissing = {
            status: 404,
            code: 'model_not_found',
            message: 'The model does not exist',
        };

        expect(getOpenAIErrorSummary(modelMissing)).toEqual({
            type: 'permission',
            message:
                'OpenAI denied access to the requested model. Try another model or check your ' +
                'OpenAI account permissions.',
        });
    });

    it('flags provider outages on server errors', async () => {
        const { getOpenAIErrorSummary } = await import('../frontend/src/utils/openAI.js');
        const outage = { status: 503, message: 'Service unavailable' };

        expect(getOpenAIErrorSummary(outage)).toEqual({
            type: 'server',
            message: 'OpenAI is unavailable right now. Please try again in a moment.',
        });
    });

    it('uses network messaging when the root cause is a fetch failure', async () => {
        const { getOpenAIErrorSummary } = await import('../frontend/src/utils/openAI.js');
        const error = { cause: new TypeError('Failed to fetch') };

        expect(getOpenAIErrorSummary(error)).toEqual({
            type: 'network',
            message: 'We could not reach OpenAI. Check your connection and try again.',
        });
    });

    it('falls back to the generic message for unknown errors', async () => {
        const { getOpenAIErrorSummary } = await import('../frontend/src/utils/openAI.js');
        const error = { status: 418, message: 'Unexpected teapot' };

        expect(getOpenAIErrorSummary(error)).toEqual({
            type: 'unknown',
            message: "Sorry, I'm having some trouble and can't generate a response.",
        });
    });
});
