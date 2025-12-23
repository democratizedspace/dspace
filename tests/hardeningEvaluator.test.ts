import { describe, expect, it } from 'vitest';
import {
  evaluateProcessQuality,
  evaluateQuestQuality,
  statusEmoji,
  validateHardening
} from '../scripts/hardening.js';

describe('hardening evaluators', () => {
  it('scores richer quests higher', () => {
    const bareQuest = {
      description: 'short',
      dialogue: [
        {
          id: 'start',
          text: 'Hi',
          options: [{ type: 'finish', text: 'bye' }]
        }
      ]
    };
    const richQuest = {
      description: 'A longer description that exceeds the baseline scoring threshold for quality.',
      image: '/assets/example.jpg',
      rewards: [{ id: 'item-1', count: 1 }],
      requiresQuests: ['prev'],
      dialogue: [
        {
          id: 'start',
          text: 'Welcome to the mission',
          options: [
            { type: 'goto', text: 'continue', goto: 'work', requiresItems: [{ id: 'a', count: 1 }] },
            { type: 'finish', text: 'done', process: 'proc-1' }
          ]
        },
        { id: 'work', text: 'Do stuff with branching', options: [{ type: 'finish', text: 'finish' }] }
      ]
    };

    expect(evaluateQuestQuality(richQuest)).toBeGreaterThan(evaluateQuestQuality(bareQuest));
  });

  it('scores processes with items and duration higher', () => {
    const simpleProcess = { id: 'p1', title: 'noop', duration: '5s' };
    const strongProcess = {
      id: 'p2',
      title: 'Assemble rocket fin can',
      duration: '2h 30m',
      requireItems: [{ id: 'a', count: 1 }],
      consumeItems: [{ id: 'b', count: 2 }],
      createItems: [{ id: 'c', count: 1 }]
    };

    expect(evaluateProcessQuality(strongProcess)).toBeGreaterThan(evaluateProcessQuality(simpleProcess));
  });

  it('validates hardening shape and emoji thresholds', () => {
    const hardening = {
      passes: 2,
      score: 80,
      emoji: statusEmoji(2, 80),
      history: [
        { task: 'pass-1', date: '2025-01-01', score: 75 },
        { task: 'pass-2', date: '2025-02-01', score: 80 }
      ]
    };

    const result = validateHardening(hardening);
    expect(result.valid).toBe(true);
    expect(hardening.emoji).toBe('✅');
  });
});
