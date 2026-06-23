import { describe, expect, test } from 'vitest';
import {
  buildPromptMetrics,
  PROMPT_COMPONENTS,
  summarizeTextSize,
} from '../frontend/src/utils/promptMetrics.js';

describe('prompt metrics', () => {
  test('returns sizes without prompt content strings', () => {
    const metrics = buildPromptMetrics(
      {
        combinedMessages: [
          { role: 'user', content: 'PRIVATE_SYNTHETIC_SENTINEL' },
        ],
      },
      { componentByMessageIndex: { 0: PROMPT_COMPONENTS.latestUserMessage } }
    );

    expect(metrics.messageCount).toBe(1);
    expect(JSON.stringify(metrics)).not.toContain('PRIVATE_SYNTHETIC_SENTINEL');
    expect(metrics.perMessage[0]).toEqual({
      index: 0,
      role: 'user',
      characters: 'PRIVATE_SYNTHETIC_SENTINEL'.length,
      utf8Bytes: 'PRIVATE_SYNTHETIC_SENTINEL'.length,
    });
  });

  test('counts UTF-8 bytes independently from JavaScript characters', () => {
    expect(summarizeTextSize('aé🚀')).toEqual({ characters: 4, utf8Bytes: 7 });
  });

  test('accounts components deterministically', () => {
    const metrics = buildPromptMetrics(
      {
        combinedMessages: [
          { role: 'system', content: 'abcd' },
          { role: 'system', content: 'éé' },
          { role: 'assistant', content: 'history' },
          { role: 'user', content: 'latest' },
        ],
      },
      {
        componentByMessageIndex: {
          0: PROMPT_COMPONENTS.systemInstructions,
          1: PROMPT_COMPONENTS.rag,
          2: PROMPT_COMPONENTS.chatHistory,
          3: PROMPT_COMPONENTS.latestUserMessage,
        },
        promptBuildMs: 12,
        ragMs: 3,
      }
    );

    expect(metrics.roleCounts).toEqual({ system: 2, assistant: 1, user: 1 });
    expect(metrics.componentTotals.systemInstructions).toEqual({
      messageCount: 1,
      characters: 4,
      utf8Bytes: 4,
    });
    expect(metrics.componentTotals.rag).toEqual({
      messageCount: 1,
      characters: 2,
      utf8Bytes: 4,
    });
    expect(metrics.timingsMs).toEqual({ promptBuild: 12, rag: 3 });
  });
});
