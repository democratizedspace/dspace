import { beforeEach, describe, expect, test, vi } from 'vitest';
import { buildPromptMetrics } from '../frontend/src/utils/promptMetrics.js';
import { buildDchatKnowledgePack } from '../frontend/src/utils/dchatKnowledge.js';
import { searchDocsRag } from '../frontend/src/utils/docsRag.js';

vi.mock('../frontend/src/utils/gameState/common.js', () => ({
  loadGameState: vi.fn(() => ({})),
  ready: Promise.resolve(),
}));

vi.mock('../frontend/src/utils/dchatKnowledge.js', () => ({
  buildDchatKnowledgePack: vi.fn(() => ({ summary: '', sources: [] })),
}));

vi.mock('../frontend/src/utils/docsRag.js', () => ({
  searchDocsRag: vi.fn(async () => ({ excerptsText: '', sources: [] })),
}));

describe('buildPromptMetrics', () => {
  beforeEach(() => {
    vi.mocked(buildDchatKnowledgePack).mockReturnValue({
      summary: '',
      sources: [],
    });
    vi.mocked(searchDocsRag).mockResolvedValue({
      excerptsText: '',
      sources: [],
    });
  });

  test('returns content-free prompt metrics', () => {
    const secret = 'synthetic secret prompt text';
    const metrics = buildPromptMetrics(
      { combinedMessages: [{ role: 'user', content: secret }] },
      { componentMessageIndexes: { latestUserMessage: 0 } }
    );
    const serialized = JSON.stringify(metrics);
    expect(serialized).not.toContain(secret);
    expect(metrics.perMessage[0]).toEqual({
      index: 0,
      role: 'user',
      characters: secret.length,
      utf8Bytes: new TextEncoder().encode(secret).length,
    });
  });

  test('counts UTF-8 bytes correctly', () => {
    const content = 'A🚀é';
    const metrics = buildPromptMetrics({
      combinedMessages: [{ role: 'user', content }],
    });
    expect(metrics.totalCharacters).toBe(4);
    expect(metrics.totalUtf8Bytes).toBe(7);
  });

  test('component accounting is deterministic from final message indexes', () => {
    const payload = {
      combinedMessages: [
        { role: 'system', content: 'system' },
        { role: 'system', content: 'rag' },
        { role: 'user', content: 'history' },
        { role: 'user', content: 'latest' },
      ],
    };
    const metadata = {
      componentMessageIndexes: {
        systemInstructions: 0,
        rag: [1],
        chatHistory: [2],
        latestUserMessage: 3,
      },
    };
    expect(buildPromptMetrics(payload, metadata)).toEqual(
      buildPromptMetrics(payload, metadata)
    );
    expect(buildPromptMetrics(payload, metadata).componentTotals).toMatchObject(
      {
        systemInstructions: { characters: 6, utf8Bytes: 6 },
        rag: { characters: 3, utf8Bytes: 3 },
        chatHistory: { characters: 7, utf8Bytes: 7 },
        latestUserMessage: { characters: 6, utf8Bytes: 6 },
      }
    );
  });

  test('buildChatPrompt metrics count only the RAG message included in the final prompt', async () => {
    const knowledgeSummary = 'synthetic knowledge summary';
    const docsExcerpt = 'synthetic docs excerpt omitted from final prompt';
    vi.mocked(buildDchatKnowledgePack).mockReturnValue({
      summary: knowledgeSummary,
      sources: [],
    });
    vi.mocked(searchDocsRag).mockResolvedValue({
      excerptsText: docsExcerpt,
      sources: [],
    });

    const { buildChatPrompt } = await import('../frontend/src/utils/openAI.js');
    const userMessage = 'Where should I go next?';
    const instrumented = await buildChatPrompt([{ role: 'user', content: userMessage }], {
      includePromptMetrics: true,
    });
    const ragMessages = instrumented.combinedMessages.filter((message) =>
      message.content.includes('DSPACE knowledge base:')
    );

    expect(ragMessages).toHaveLength(1);
    expect(ragMessages[0].content).toContain(knowledgeSummary);
    expect(ragMessages[0].content).toContain(docsExcerpt);
    expect(instrumented.combinedMessages).not.toContainEqual({
      role: 'system',
      content: docsExcerpt,
    });
    expect(instrumented.promptMetrics.componentTotals.rag.characters).toBe(
      ragMessages[0].content.length
    );
    expect(JSON.stringify(instrumented.promptMetrics)).not.toContain(userMessage);
    expect(JSON.stringify(instrumented.promptMetrics)).not.toContain(docsExcerpt);
  });

  test('buildChatPrompt leaves instrumentation disabled unless requested', async () => {
    const { buildChatPrompt } = await import('../frontend/src/utils/openAI.js');
    const messages = [{ role: 'user', content: 'hello' }];
    const baseline = await buildChatPrompt(messages);
    const instrumented = await buildChatPrompt(messages, {
      includePromptMetrics: true,
    });
    expect(baseline.promptMetrics).toBeUndefined();
    expect(instrumented.combinedMessages).toEqual(baseline.combinedMessages);
    expect(instrumented.promptMetrics.messageCount).toBe(
      instrumented.combinedMessages.length
    );
    expect(JSON.stringify(instrumented.promptMetrics)).not.toContain('hello');
  });
});
