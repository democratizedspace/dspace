import { describe, expect, it, vi } from 'vitest';

vi.mock('openai', () => ({ default: vi.fn() }));
vi.mock('../frontend/src/utils/gameState/common.js', () => ({
  loadGameState: vi.fn(() => ({})),
  ready: Promise.resolve(),
}));
vi.mock('../frontend/src/utils/docsRag.js', () => ({
  searchDocsRag: vi.fn(async () => ({ excerptsText: '', sources: [] })),
}));

describe('buildChatPrompt prompt metrics option', () => {
  it('keeps instrumentation disabled behavior unchanged', async () => {
    const { buildChatPrompt } = await import('../frontend/src/utils/openAI.js');
    const messages = [{ role: 'user', content: 'hello' }];
    const withoutMetrics = await buildChatPrompt(messages);
    const withMetrics = await buildChatPrompt(messages, {
      includePromptMetrics: true,
    });

    expect(withoutMetrics.promptMetrics).toBeUndefined();
    expect(withMetrics.promptMetrics).toEqual(
      expect.objectContaining({
        messageCount: withMetrics.combinedMessages.length,
      })
    );
    expect(withoutMetrics.combinedMessages).toEqual(
      withMetrics.combinedMessages
    );
  });
});
