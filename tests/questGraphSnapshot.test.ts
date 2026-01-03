import { describe, expect, it } from 'vitest';

import type { QuestGraph, QuestNode } from '../frontend/src/lib/quests/questGraph';
import {
  buildQuestGraphSnapshot,
  serializeQuestGraph,
} from '../frontend/src/lib/quests/questGraphSnapshot';

const buildGraph = (): QuestGraph => {
  const nodes: QuestNode[] = [
    {
      canonicalKey: 'beta/quest.json',
      title: 'Beta',
      group: 'beta',
      basename: 'quest.json',
      requires: ['welcome/howtodoquests.json', 'alpha/quest.json'],
    },
    {
      canonicalKey: 'zeta/orphan.json',
      title: 'Zeta',
      group: 'zeta',
      basename: 'orphan.json',
      requires: [],
    },
    {
      canonicalKey: 'welcome/howtodoquests.json',
      title: 'Root',
      group: 'welcome',
      basename: 'howtodoquests.json',
      requires: [],
    },
    {
      canonicalKey: 'alpha/quest.json',
      title: 'Alpha',
      group: 'alpha',
      basename: 'quest.json',
      requires: ['zeta/orphan.json'],
    },
  ];

  const byKey = Object.fromEntries(nodes.map((node) => [node.canonicalKey, node]));

  return {
    nodes,
    edges: [
      { from: 'welcome/howtodoquests.json', to: 'beta/quest.json' },
      { from: 'alpha/quest.json', to: 'beta/quest.json' },
      { from: 'welcome/howtodoquests.json', to: 'alpha/quest.json' },
    ],
    byKey,
    requiredBy: {},
    depthByKey: {},
    reachableFromRoot: [
      'beta/quest.json',
      'welcome/howtodoquests.json',
      'alpha/quest.json',
    ],
    diagnostics: {
      missingRefs: [
        { from: 'beta/quest.json', ref: 'zeta/missing.json' },
        { from: 'alpha/quest.json', ref: 'alpha/missing.json' },
      ],
      ambiguousRefs: [
        {
          from: 'alpha/quest.json',
          ref: 'dup.json',
          candidates: ['zeta/orphan.json', 'alpha/quest.json'],
        },
        {
          from: 'beta/quest.json',
          ref: 'dup.json',
          candidates: ['alpha/quest.json', 'zeta/orphan.json'],
        },
      ],
      unreachableNodes: ['zeta/orphan.json', 'alpha/quest.json'],
      cycles: [
        ['zeta/orphan.json', 'welcome/howtodoquests.json', 'zeta/orphan.json'],
        ['beta/quest.json', 'alpha/quest.json', 'beta/quest.json'],
      ],
    },
  };
};

describe('quest graph snapshot serialization', () => {
  it('orders nodes, edges, and diagnostics deterministically', () => {
    const graph = buildGraph();

    const serialized = serializeQuestGraph(graph, {
      metadata: {
        version: 'v-test',
        builtAt: '2024-01-01T00:00:00.000Z',
      },
    });
    const snapshot = JSON.parse(serialized);

    expect(snapshot.version).toBe('v-test');
    expect(snapshot.builtAt).toBe('2024-01-01T00:00:00.000Z');
    expect(snapshot.rootKey).toBe('welcome/howtodoquests.json');
    expect(snapshot.nodes.map((node: QuestNode) => node.canonicalKey)).toEqual([
      'alpha/quest.json',
      'beta/quest.json',
      'welcome/howtodoquests.json',
      'zeta/orphan.json',
    ]);
    const betaNode = snapshot.nodes.find(
      (node: QuestNode) => node.canonicalKey === 'beta/quest.json'
    );
    expect(betaNode?.requires).toEqual([
      'alpha/quest.json',
      'welcome/howtodoquests.json',
    ]);
    expect(snapshot.edges.map((edge: { from: string; to: string }) => `${edge.from}->${edge.to}`))
      .toEqual([
        'alpha/quest.json->beta/quest.json',
        'welcome/howtodoquests.json->alpha/quest.json',
        'welcome/howtodoquests.json->beta/quest.json',
      ]);
    expect(snapshot.diagnostics.unreachableNodes).toEqual([
      'alpha/quest.json',
      'zeta/orphan.json',
    ]);
    expect(snapshot.diagnostics.ambiguousRefs).toEqual([
      {
        from: 'alpha/quest.json',
        ref: 'dup.json',
        candidates: ['alpha/quest.json', 'zeta/orphan.json'],
      },
      {
        from: 'beta/quest.json',
        ref: 'dup.json',
        candidates: ['alpha/quest.json', 'zeta/orphan.json'],
      },
    ]);
    expect(snapshot.diagnostics.cycles).toEqual([
      ['beta/quest.json', 'alpha/quest.json', 'beta/quest.json'],
      ['zeta/orphan.json', 'welcome/howtodoquests.json', 'zeta/orphan.json'],
    ]);
  });

  it('produces stable JSON output across calls', () => {
    const graph = buildGraph();
    const metadata = {
      version: 'v-test',
      builtAt: '2024-01-01T00:00:00.000Z',
    };

    const first = serializeQuestGraph(graph, { metadata });
    const second = serializeQuestGraph(graph, { metadata });
    const snapshot = buildQuestGraphSnapshot(graph, { metadata });

    expect(first).toBe(second);
    expect(JSON.parse(first)).toMatchObject(snapshot);
  });
});
