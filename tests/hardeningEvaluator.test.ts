import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HARDENING,
  emojiForHardening,
  evaluateProcessQuality,
  evaluateQuestQuality,
  normalizeHardening,
  validateHardening,
} from '../frontend/src/utils/hardening.js';

describe('hardening utility functions', () => {
  it('assigns emojis based on passes and score thresholds', () => {
    expect(emojiForHardening(0, 0)).toBe('🛠️');
    expect(emojiForHardening(1, 65)).toBe('🌀');
    expect(emojiForHardening(2, 80)).toBe('✅');
    expect(emojiForHardening(3, 95)).toBe('💯');
  });

  it('normalizes and validates hardening blocks', () => {
    const normalized = normalizeHardening(
      {
        passes: 2,
        score: 50,
        emoji: '🌀',
        history: [
          { task: 't1', date: '2025-01-02', score: 50 },
          { task: 't2', date: '2025-01-03', score: 55 },
        ],
      },
      { expectedScore: 70 }
    );

    expect(normalized.score).toBeGreaterThanOrEqual(70);
    expect(normalized.passes).toBe(2);
    expect(normalized.emoji).toBe('🌀');
    expect(validateHardening(normalized, 70)).toHaveLength(0);
  });

  it('scores quests based on structure and options', () => {
    const questScore = evaluateQuestQuality({
      title: 'Example Quest Title',
      description: 'A detailed description that comfortably exceeds eighty characters in length.',
      dialogue: [
        {
          id: 'start',
          text: 'hello',
          options: [
            { type: 'goto', goto: 'middle', text: 'go' },
            { type: 'finish', goto: 'finish', text: 'finish' },
          ],
        },
        {
          id: 'middle',
          text: 'middle step',
          options: [{ type: 'process', process: 'build', text: 'build' }],
        },
        { id: 'finish', text: 'done', options: [{ type: 'finish', goto: 'finish', text: 'end' }] },
      ],
      rewards: [{ id: 'reward', count: 1 }],
      requiresQuests: [],
    });

    expect(questScore).toBeGreaterThan(40);
    expect(questScore).toBeLessThanOrEqual(100);
  });

  it('scores processes based on duration and item relationships', () => {
    const processScore = evaluateProcessQuality({
      id: 'demo-process',
      title: 'Build a demo process',
      requireItems: [{ id: 'item-1', count: 1 }],
      consumeItems: [{ id: 'item-2', count: 1 }],
      createItems: [{ id: 'item-3', count: 1 }],
      duration: '45m',
      hardening: DEFAULT_HARDENING,
    });

    expect(processScore).toBeGreaterThan(40);
    expect(processScore).toBeLessThanOrEqual(100);
  });
});
