import { describe, expect, test, vi } from 'vitest';
import { buildPromptMetrics } from '../frontend/src/utils/promptMetrics.js';

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
  test('returns content-free prompt metrics', () => {
    const secret = 'synthetic secret prompt text';
    const metrics = buildPromptMetrics(
      { combinedMessages: [{ role: 'user', content: secret }] },
      { components: { latestUserMessage: secret } }
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

  test('component accounting is deterministic', () => {
    const payload = {
      combinedMessages: [
        { role: 'system', content: 'system' },
        { role: 'system', content: 'rag' },
        { role: 'user', content: 'history' },
        { role: 'user', content: 'latest' },
      ],
    };
    const metadata = {
      components: {
        systemInstructions: 'system',
        rag: 'rag',
        chatHistory: ['history'],
        latestUserMessage: 'latest',
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
