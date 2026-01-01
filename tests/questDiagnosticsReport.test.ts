import { describe, expect, it } from 'vitest';
import {
  buildQuestGraph,
  type QuestData,
  type QuestGraph,
} from '../frontend/src/lib/quests/questGraph';
import { buildQuestDiagnosticsReport } from '../frontend/src/lib/quests/questDiagnosticsReport';

const buildGraph = (): QuestGraph => {
  const quests: QuestData[] = [
    {
      path: './json/welcome/howtodoquests.json',
      quest: { title: 'Root', id: 'root' },
    },
    {
      path: './json/path/child.json',
      quest: {
        title: 'Child',
        requiresQuests: ['welcome/howtodoquests.json', 'path/helper.json'],
      },
    },
    {
      path: './json/path/helper.json',
      quest: { title: 'Helper', requiresQuests: ['missing.json'] },
    },
    {
      path: './json/alt/shared.json',
      quest: { title: 'Shared' },
    },
    {
      path: './json/extra/shared.json',
      quest: { title: 'Shared twin' },
    },
    {
      path: './json/path/ambiguous-user.json',
      quest: { title: 'Ambiguous User', requiresQuests: ['shared.json'] },
    },
    {
      path: './json/loop/first.json',
      quest: { title: 'Loop One', requiresQuests: ['loop/second.json'] },
    },
    {
      path: './json/loop/second.json',
      quest: { title: 'Loop Two', requiresQuests: ['loop/first.json'] },
    },
    {
      path: './json/orphan/unreachable.json',
      quest: { title: 'Isolated' },
    },
  ];

  return buildQuestGraph({ quests });
};

describe('buildQuestDiagnosticsReport', () => {
  it('produces deterministic, sorted output for a fixed graph', () => {
    const graph = buildGraph();
    const options = { timestamp: '2025-01-01T00:00:00.000Z' };

    const first = buildQuestDiagnosticsReport(graph, options);
    const second = buildQuestDiagnosticsReport(graph, options);

    const expected = {
      timestamp: '2025-01-01T00:00:00.000Z',
      root: 'welcome/howtodoquests.json',
      counts: {
        missingRefs: 1,
        ambiguousRefs: 1,
        unreachable: 7,
        cycles: 1,
      },
      missingRefs: [{ from: 'path/helper.json', ref: 'missing.json' }],
      ambiguousRefs: [
        {
          from: 'path/ambiguous-user.json',
          ref: 'shared.json',
          candidates: ['alt/shared.json', 'extra/shared.json'],
        },
      ],
      unreachable: [
        'alt/shared.json',
        'extra/shared.json',
        'loop/first.json',
        'loop/second.json',
        'orphan/unreachable.json',
        'path/ambiguous-user.json',
        'path/helper.json',
      ],
      cycles: [['loop/first.json', 'loop/second.json', 'loop/first.json']],
      multiParentTop: [
        {
          canonicalKey: 'path/child.json',
          title: 'Child',
          requires: ['path/helper.json', 'welcome/howtodoquests.json'],
          requiresCount: 2,
        },
      ],
    };

    expect(first).toEqual(expected);
    expect(second).toEqual(expected);
  });
});
