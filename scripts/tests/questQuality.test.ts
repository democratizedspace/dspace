import { describe, expect, test } from 'vitest';

describe('scoreQuest', () => {
  test('falls back to heuristic when api key missing', async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const { scoreQuest } = await import('../utils/llm');
    const score = await scoreQuest('short');
    expect(score).toBe(0.5);
    if (originalKey !== undefined) {
      process.env.OPENAI_API_KEY = originalKey;
    }
  });
});
