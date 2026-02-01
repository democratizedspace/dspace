import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadGameStateMock = vi.fn();
const buildDchatKnowledgePackMock = vi.fn();
const searchDocsRagMock = vi.fn();

let capturedPayload;

const MockOpenAI = function (config) {
    this.config = config;
    this.responses = {
        create: async (payload) => {
            capturedPayload = payload;
            return {
                output_text: 'ok',
                output: [
                    {
                        content: [
                            {
                                type: 'output_text',
                                text: 'ok',
                            },
                        ],
                    },
                ],
            };
        },
    };
};

vi.mock('../frontend/src/utils/gameState/common.js', () => ({
    loadGameState: loadGameStateMock,
    ready: Promise.resolve(),
}));

vi.mock('../frontend/src/utils/dchatKnowledge.js', () => ({
    buildDchatKnowledgePack: buildDchatKnowledgePackMock,
}));

vi.mock('../frontend/src/utils/docsRag.js', () => ({
    searchDocsRag: searchDocsRagMock,
}));

describe('chat non-reasoning regression probes', () => {
    beforeEach(() => {
        capturedPayload = undefined;
        loadGameStateMock.mockReset();
        buildDchatKnowledgePackMock.mockReset();
        searchDocsRagMock.mockReset();
        process.env.VITE_CHAT_MODEL = 'gpt-5-mini';
        delete process.env.VITE_CHAT_FALLBACK_MODELS;
        globalThis.__DSpaceOpenAIClient = MockOpenAI;
        loadGameStateMock.mockReturnValue({
            openAI: {
                ['api' + 'Key']: 'demo-session',
            },
        });
        buildDchatKnowledgePackMock.mockReturnValue({ summary: '', sources: [] });
        searchDocsRagMock.mockResolvedValue({ excerptsText: '', sources: [] });
    });

    afterEach(() => {
        delete globalThis.__DSpaceOpenAIClient;
        delete process.env.VITE_CHAT_MODEL;
        delete process.env.VITE_CHAT_FALLBACK_MODELS;
        vi.restoreAllMocks();
    });

    it('uses the configured non-reasoning model and preserves system guardrails', async () => {
        const { GPT5Chat } = await import('../frontend/src/utils/openAI.js');

        await GPT5Chat([
            {
                role: 'user',
                content:
                    'What is the exact number of quests in v3 and the exact average time-to-' +
                    'complete?',
            },
        ]);

        expect(capturedPayload?.model).toBe('gpt-5-mini');
        const systemPrompt = capturedPayload?.input?.[0]?.content?.[0]?.text ?? '';
        expect(systemPrompt).toContain(
            'Only give exact counts/durations/rates if they appear in retrieved context; ' +
                "otherwise be approximate or say you don't know."
        );
        expect(systemPrompt).toContain(
            "If you're missing context, say you don't know and ask a clarifying question OR " +
                'point to a specific /docs page.'
        );
    });

    it('replaces suspicious precision when citations are missing', async () => {
        const { validateChatResponseText, suspiciousPrecisionFallback } = await import(
            '../frontend/src/utils/openAI.js'
        );

        const flagged = validateChatResponseText('The drop rate is 7.3%.');
        const cited = validateChatResponseText('The drop rate is 7.3%. See /docs/quests.');

        expect(flagged).toBe(suspiciousPrecisionFallback);
        expect(cited).toBe('The drop rate is 7.3%. See /docs/quests.');
    });
});
