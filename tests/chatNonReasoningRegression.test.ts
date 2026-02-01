import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadGameStateMock = vi.fn();
const buildDchatKnowledgePackMock = vi.fn();
const responsesCreateMock = vi.fn();

const MockOpenAI = function () {
  this.responses = {
    create: responsesCreateMock,
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
  searchDocsRag: vi.fn(async () => ({ excerptsText: '', sources: [] })),
}));

describe('non-reasoning chat regression probes', () => {
  const originalChatModel = process.env.VITE_CHAT_MODEL;
  const originalFallbackModels = process.env.VITE_CHAT_FALLBACK_MODELS;

  beforeEach(() => {
    globalThis.__DSpaceOpenAIClient = MockOpenAI;
    responsesCreateMock.mockReset();
    loadGameStateMock.mockReset();
    buildDchatKnowledgePackMock.mockReset();
    process.env.VITE_CHAT_MODEL = 'gpt-5-mini';
    delete process.env.VITE_CHAT_FALLBACK_MODELS;

    loadGameStateMock.mockReturnValue({
      openAI: {
        ['api' + 'Key']: 'test-key',
      },
    });
    buildDchatKnowledgePackMock.mockReturnValue({ summary: null, sources: [] });
  });

  afterEach(() => {
    delete globalThis.__DSpaceOpenAIClient;
    if (originalChatModel === undefined) {
      delete process.env.VITE_CHAT_MODEL;
    } else {
      process.env.VITE_CHAT_MODEL = originalChatModel;
    }
    if (originalFallbackModels === undefined) {
      delete process.env.VITE_CHAT_FALLBACK_MODELS;
    } else {
      process.env.VITE_CHAT_FALLBACK_MODELS = originalFallbackModels;
    }
  });

  it('injects guardrails into the system prompt for non-reasoning chat config', async () => {
    responsesCreateMock.mockResolvedValue({ output_text: 'ok' });

    const { GPT5Chat } = await import('../frontend/src/utils/openAI.js');
    await GPT5Chat([
      {
        role: 'user',
        content: 'What is the exact number of quests in v3 and the exact average time-to-complete?',
      },
    ]);

    expect(responsesCreateMock).toHaveBeenCalledTimes(1);
    const payload = responsesCreateMock.mock.calls[0][0];
    expect(payload.model).toBe('gpt-5-mini');
    const systemText = payload.input?.[0]?.content?.[0]?.text ?? '';
    expect(systemText).toContain(
      "If you're missing context, say you don't know and ask a clarifying question OR point to a specific /docs page."
    );
    expect(systemText).toContain(
      "Only give exact counts/durations/rates if they appear in retrieved context; otherwise be approximate or say you don't know."
    );
  });

  it('falls back when a precise answer lacks citation markers', async () => {
    responsesCreateMock.mockResolvedValue({
      output_text: 'The exact number is exactly 123 and the drop rate is 7.3%.',
    });

    const { GPT5Chat, safeFallbackChatMessage } = await import('../frontend/src/utils/openAI.js');
    const response = await GPT5Chat([
      {
        role: 'user',
        content: 'What is the exact number of quests in v3 and the exact average time-to-complete?',
      },
    ]);

    expect(response).toBe(safeFallbackChatMessage);
  });
});
