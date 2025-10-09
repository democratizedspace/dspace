// Test resilience of scoreQuest to invalid OpenAI responses.
import { describe, expect, test, vi } from 'vitest';

const createResponseMock = vi.fn().mockResolvedValue({
  output_text: 'not-a-number',
});

vi.mock('openai', () => {
  return {
    default: class {
      responses = {
        create: createResponseMock,
      };
    },
  };
});

describe('scoreQuest', () => {
  test('falls back to 0.5 when OpenAI returns non-numeric content', async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'test-key';
    const { scoreQuest } = await import('../scripts/utils/llm.js');
    const score = await scoreQuest('dialogue');
    expect(score).toBe(0.5);
    expect(createResponseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5-chat-latest',
      })
    );
    if (originalKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalKey;
    }
  });

  test('uses heuristic when API key is missing', async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const { scoreQuest } = await import('../scripts/utils/llm.js');
    const shortScore = await scoreQuest('short');
    const longScore = await scoreQuest('x'.repeat(101));
    expect(shortScore).toBe(0.5);
    expect(longScore).toBe(0.8);
    if (originalKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalKey;
    }
  });
});
