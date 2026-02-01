import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadGameStateMock = vi.fn();
const buildDchatKnowledgePackMock = vi.fn();
const searchDocsRagMock = vi.fn();
const responsesCreateMock = vi.fn();

const MockOpenAI = vi.fn().mockImplementation(() => ({
    responses: {
        create: responsesCreateMock,
    },
}));

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

describe('non-reasoning chat regression probes', () => {
    beforeEach(() => {
        responsesCreateMock.mockReset();
        loadGameStateMock.mockReset();
        buildDchatKnowledgePackMock.mockReset();
        searchDocsRagMock.mockReset();
        globalThis.__DSpaceOpenAIClient = MockOpenAI;
        process.env.VITE_CHAT_MODEL = 'gpt-5-mini';
        process.env.VITE_CHAT_FALLBACK_MODELS = 'gpt-5.2';
    });

    afterEach(() => {
        delete globalThis.__DSpaceOpenAIClient;
        delete process.env.VITE_CHAT_MODEL;
        delete process.env.VITE_CHAT_FALLBACK_MODELS;
    });

    it('uses the non-reasoning chat model and guards against confident guessing', async () => {
        loadGameStateMock.mockReturnValue({ openAI: { ['api' + 'Key']: 'test-key' } });
        buildDchatKnowledgePackMock.mockReturnValue({ summary: null, sources: [] });
        searchDocsRagMock.mockResolvedValue({ excerptsText: '', sources: [] });
        responsesCreateMock.mockResolvedValue({ output_text: 'ok' });

        const { GPT5Chat } = await import('../frontend/src/utils/openAI.js');

        await GPT5Chat([
            {
                role: 'user',
                content:
                    'What is the exact number of quests in v3 and the exact average ' +
                    'time-to-complete?',
            },
        ]);

        expect(responsesCreateMock).toHaveBeenCalledTimes(1);
        const call = responsesCreateMock.mock.calls[0][0];
        expect(call.model).toBe('gpt-5-mini');
        const systemPrompt = call.input[0]?.content?.[0]?.text ?? '';
        expect(systemPrompt).toContain(
            'Only give exact counts/durations/rates if they appear in retrieved context'
        );
        expect(systemPrompt).toContain("If you're missing context, say you don't know");
    });

    it('replaces suspicious precision with a safe fallback when citations are missing', async () => {
        loadGameStateMock.mockReturnValue({ openAI: { ['api' + 'Key']: 'test-key' } });
        buildDchatKnowledgePackMock.mockReturnValue({ summary: null, sources: [] });
        searchDocsRagMock.mockResolvedValue({ excerptsText: '', sources: [] });
        responsesCreateMock.mockResolvedValue({ output_text: 'Exactly 123 quests on average.' });

        const { GPT5Chat } = await import('../frontend/src/utils/openAI.js');

        const result = await GPT5Chat([
            {
                role: 'user',
                content:
                    'What is the exact number of quests in v3 and the exact average ' +
                    'time-to-complete?',
            },
        ]);

        expect(result).toBe("I don't know; please check /docs for the latest details.");
    });
});
