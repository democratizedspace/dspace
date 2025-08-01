import { afterEach, describe, expect, test, vi } from 'vitest';
const { scoreQuest } = require('../utils/llm');

vi.mock('openai', () => {
  return {
    Configuration: vi.fn(),
    OpenAIApi: vi.fn().mockImplementation(() => ({
      createChatCompletion: vi.fn().mockResolvedValue({
        data: { choices: [{ message: { content: '0.9' } }] }
      })
    }))
  };
});

describe('scoreQuest', () => {
  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  test('falls back to heuristic when api key missing', async () => {
    const score = await scoreQuest('short');
    expect(score).toBe(0.5);
  });

  test('uses openai when api key provided', async () => {
    process.env.OPENAI_API_KEY = 'test';
    const score = await scoreQuest('some long dialogue text that is definitely longer than one hundred characters so that heuristics would not override the openai result.');
    expect(score).toBe(0.9);
  });
});
