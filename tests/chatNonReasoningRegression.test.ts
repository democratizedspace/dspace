import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const responsesCreateMock = vi.fn();
const MockOpenAI = vi.fn().mockImplementation(() => ({
    responses: { create: responsesCreateMock },
}));

vi.mock('../frontend/src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({ openAI: { ['api' + 'Key']: 'test-key' } })),
    ready: Promise.resolve(),
}));

vi.mock('../frontend/src/utils/dchatKnowledge.js', () => ({
    buildDchatKnowledgePack: vi.fn(() => ({ summary: null, sources: [] })),
}));

vi.mock('../frontend/src/utils/docsRag.js', () => ({
    searchDocsRag: vi.fn(async () => ({ excerptsText: '', sources: [] })),
}));

describe('chat non-reasoning regression probes', () => {
    beforeEach(() => {
        vi.resetModules();
        responsesCreateMock.mockReset();
        globalThis.__DSpaceOpenAIClient = MockOpenAI;
        process.env.VITE_CHAT_MODEL = 'gpt-5-mini';
    });

    afterEach(() => {
        delete globalThis.__DSpaceOpenAIClient;
        delete process.env.VITE_CHAT_MODEL;
        delete process.env.VITE_CHAT_FALLBACK_MODELS;
    });

    it('uses the non-reasoning model and includes guardrails in the system prompt', async () => {
        responsesCreateMock.mockResolvedValueOnce({ output_text: 'ok' });
        const { GPT5Chat } = await import('../frontend/src/utils/openAI.js');

        await GPT5Chat([
            {
                role: 'user',
                content:
                    'What is the exact number of quests in v3 and the exact average time-to-complete?',
            },
        ]);

        expect(responsesCreateMock).toHaveBeenCalledTimes(1);
        const payload = responsesCreateMock.mock.calls[0][0];
        expect(payload.model).toBe('gpt-5-mini');
        expect(payload.input[0].role).toBe('system');
        expect(payload.input[0].content[0].text).toContain(
            'Only give exact counts/durations/rates if they appear in retrieved context; otherwise be ' +
                "approximate or say you don't know."
        );
        expect(payload.input[0].content[0].text).toContain(
            "If you're missing context, say you don't know and ask a clarifying question OR point " +
                'to a specific /docs page.'
        );
    });

    it('replaces suspicious precision without citations with a safe fallback', async () => {
        responsesCreateMock.mockResolvedValueOnce({
            output_text: 'The answer is exactly 123 quests with a drop rate of 7.3%.',
        });
        const { GPT5Chat, safeFallbackMessage } = await import('../frontend/src/utils/openAI.js');

        const reply = await GPT5Chat([
            {
                role: 'user',
                content:
                    'What is the exact number of quests in v3 and the exact average time-to-complete?',
            },
        ]);

        expect(reply).toBe(safeFallbackMessage);
    });

    it('keeps suspicious precision when inline citations are present', async () => {
        responsesCreateMock.mockResolvedValueOnce({
            output_text: 'The answer is exactly 123 quests. 【1†sources】',
        });
        const { GPT5Chat } = await import('../frontend/src/utils/openAI.js');

        const reply = await GPT5Chat([
            {
                role: 'user',
                content:
                    'What is the exact number of quests in v3 and the exact average time-to-complete?',
            },
        ]);

        expect(reply).toBe('The answer is exactly 123 quests. 【1†sources】');
    });

    it('keeps suspicious precision when a /docs link is present', async () => {
        responsesCreateMock.mockResolvedValueOnce({
            output_text: 'The answer is exactly 123 quests. See /docs/quests.',
        });
        const { GPT5Chat } = await import('../frontend/src/utils/openAI.js');

        const reply = await GPT5Chat([
            {
                role: 'user',
                content:
                    'What is the exact number of quests in v3 and the exact average time-to-complete?',
            },
        ]);

        expect(reply).toBe('The answer is exactly 123 quests. See /docs/quests.');
    });

    it('dedupes fallback models and retries with the next unique model', async () => {
        process.env.VITE_CHAT_FALLBACK_MODELS = 'gpt-5-mini, gpt-5.2, gpt-5.2';
        responsesCreateMock
            .mockRejectedValueOnce({ status: 404, message: 'Model not found' })
            .mockResolvedValueOnce({ output_text: 'ok' });
        const { GPT5Chat } = await import('../frontend/src/utils/openAI.js');

        await GPT5Chat([
            {
                role: 'user',
                content: 'List the docs route for quests.',
            },
        ]);

        expect(responsesCreateMock).toHaveBeenCalledTimes(2);
        expect(responsesCreateMock.mock.calls[0][0].model).toBe('gpt-5-mini');
        expect(responsesCreateMock.mock.calls[1][0].model).toBe('gpt-5.2');
    });

    it('answers completed quests using PlayerState when present', async () => {
        const { loadGameState } = await import('../frontend/src/utils/gameState/common.js');
        vi.mocked(loadGameState).mockReturnValueOnce({
            openAI: { ['api' + 'Key']: 'test-key' },
            versionNumberString: '3',
            quests: {
                'welcome/howtodoquests': { finished: true },
                '3dprinting/start': { finished: true },
            },
            inventory: {},
        });

        responsesCreateMock.mockImplementationOnce(async (payload) => {
            const messages = payload.input ?? [];
            const playerStateMessage = messages.find(
                (message) =>
                    message.role === 'system' &&
                    message.content?.[0]?.text?.includes('PlayerState v3')
            );
            const text = playerStateMessage?.content?.[0]?.text ?? '';
            const jsonStart = text.indexOf('{');
            const snapshot = JSON.parse(text.slice(jsonStart));
            return {
                output_text: `Completed quests: ${snapshot.questsFinished.join(', ')}`,
            };
        });

        const { GPT5Chat } = await import('../frontend/src/utils/openAI.js');
        const reply = await GPT5Chat([
            { role: 'user', content: 'What quests have I completed?' },
        ]);

        expect(reply).toContain('welcome/howtodoquests');
        expect(reply).toContain('3dprinting/start');
        expect(reply).not.toMatch(/\/gamesaves/i);
    });

    it('requests /gamesaves export when PlayerState is missing', async () => {
        const { loadGameState } = await import('../frontend/src/utils/gameState/common.js');
        vi.mocked(loadGameState).mockReturnValueOnce(null);

        responsesCreateMock.mockImplementationOnce(async (payload) => {
            const messages = payload.input ?? [];
            const hasPlayerState = messages.some(
                (message) =>
                    message.role === 'system' &&
                    message.content?.[0]?.text?.includes('PlayerState v')
            );
            if (hasPlayerState) {
                return { output_text: 'PlayerState was unexpectedly present.' };
            }
            return {
                output_text:
                    'Please export/paste a save from /gamesaves. See /docs/backups for steps.',
            };
        });

        const { GPT5Chat } = await import('../frontend/src/utils/openAI.js');
        const reply = await GPT5Chat([
            { role: 'user', content: 'What quests have I completed?' },
        ]);

        expect(reply).toMatch(/\/gamesaves/);
        expect(reply).toMatch(/\/docs\/backups|\/docs\/routes/);
    });
});
