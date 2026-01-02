import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it, afterEach } from 'vitest';

import { buildQuestGraph } from '../frontend/src/lib/quests/questGraph';

const tmpDirs: string[] = [];

const createQuestDir = (): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-graph-'));
  tmpDirs.push(dir);
  return dir;
};

const writeQuest = (
  questDir: string,
  relativePath: string,
  data: Record<string, unknown>
) => {
  const filePath = path.join(questDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 4)}\n`, 'utf8');
};

afterEach(() => {
  while (tmpDirs.length > 0) {
    const dir = tmpDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe('quest graph diagnostics', () => {
  it('reports missing dependency references', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', {
      title: 'How to do quests',
      requiresQuests: ['missing.json'],
    });
    writeQuest(questDir, 'exploration/side-quest.json', {
      title: 'Side quest',
    });

    const graph = buildQuestGraph({ questDir });

    expect(graph.diagnostics.missingRefs).toEqual([
      { from: 'welcome/howtodoquests.json', ref: 'missing.json' },
    ]);
  });

  it('reports ambiguous basenames when multiple matches exist', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', {
      title: 'How to do quests',
    });
    writeQuest(questDir, 'alpha/shared.json', { title: 'Shared one' });
    writeQuest(questDir, 'beta/shared.json', { title: 'Shared two' });
    writeQuest(questDir, 'gamma/needs.json', {
      title: 'Needs shared',
      requiresQuests: ['shared.json'],
    });

    const graph = buildQuestGraph({ questDir });

    expect(graph.diagnostics.ambiguousRefs).toEqual([
      {
        from: 'gamma/needs.json',
        ref: 'shared.json',
        candidates: ['alpha/shared.json', 'beta/shared.json'],
      },
    ]);
  });

  it('detects cycles with stable paths', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', {
      title: 'Root',
      requiresQuests: ['chain/b.json'],
    });
    writeQuest(questDir, 'chain/b.json', {
      title: 'B quest',
      requiresQuests: ['chain/c.json'],
    });
    writeQuest(questDir, 'chain/c.json', {
      title: 'C quest',
      requiresQuests: ['welcome/howtodoquests.json'],
    });

    const first = buildQuestGraph({ questDir });
    const second = buildQuestGraph({ questDir });

    const expectedCycle = [
      [
        'welcome/howtodoquests.json',
        'chain/c.json',
        'chain/b.json',
        'welcome/howtodoquests.json',
      ],
    ];

    expect(first.diagnostics.cycles).toEqual(expectedCycle);
    expect(second.diagnostics.cycles).toEqual(expectedCycle);
  });

  it('reports unreachable nodes from the root', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', { title: 'Root' });
    writeQuest(questDir, 'isolated/alone.json', { title: 'Unreachable quest' });

    const graph = buildQuestGraph({ questDir });

    expect(graph.diagnostics.unreachableNodes).toEqual(['isolated/alone.json']);
  });

  it('resolves requiresQuests by quest id field', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', {
      title: 'Root',
      requiresQuests: ['quest-id'],
    });
    writeQuest(questDir, 'chain/linked.json', {
      id: 'quest-id',
      title: 'Linked quest',
    });

    const graph = buildQuestGraph({ questDir });

    expect(graph.edges.map((edge) => `${edge.from}->${edge.to}`)).toEqual([
      'chain/linked.json->welcome/howtodoquests.json',
    ]);
  });

  it('prioritizes quest id resolution before basename matches', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', {
      title: 'Root',
      requiresQuests: ['shared-id'],
    });
    writeQuest(questDir, 'alpha/preferred.json', {
      id: 'shared-id',
      title: 'Preferred by id',
    });
    writeQuest(questDir, 'beta/shared-id.json', {
      title: 'Fallback by basename',
    });

    const graph = buildQuestGraph({ questDir });

    expect(graph.diagnostics.ambiguousRefs).toEqual([]);
    expect(graph.diagnostics.missingRefs).toEqual([]);
    expect(graph.edges.map((edge) => `${edge.from}->${edge.to}`)).toEqual([
      'alpha/preferred.json->welcome/howtodoquests.json',
    ]);
  });

  it('throws a helpful error when quest JSON is invalid', () => {
    const questDir = createQuestDir();
    const badFile = path.join(questDir, 'welcome/howtodoquests.json');
    fs.mkdirSync(path.dirname(badFile), { recursive: true });
    fs.writeFileSync(badFile, '{ invalid json', 'utf8');

    expect(() => buildQuestGraph({ questDir })).toThrowError(
      /Failed to parse quest JSON in file/
    );
  });
});

describe('quest graph ordering', () => {
  it('sorts nodes and edges deterministically', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', { title: 'Welcome' });
    writeQuest(questDir, 'aurora/alpha.json', { title: 'Alpha Title' });
    writeQuest(questDir, 'aurora/alpha-2.json', { title: 'Alpha Title' });
    writeQuest(questDir, 'aurora/zeta.json', {
      title: 'Zeta Title',
      requiresQuests: ['alpha.json'],
    });

    const graph = buildQuestGraph({ questDir });

    expect(graph.nodes.map((node) => node.canonicalKey)).toEqual([
      'aurora/alpha-2.json',
      'aurora/alpha.json',
      'aurora/zeta.json',
      'welcome/howtodoquests.json',
    ]);
    expect(graph.edges.map((edge) => `${edge.from}->${edge.to}`)).toEqual([
      'aurora/alpha.json->aurora/zeta.json',
    ]);
  });
});

describe('quest graph caching', () => {
  it('returns the same instance on cache hit', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', { title: 'Root quest' });
    writeQuest(questDir, 'exploration/side.json', { title: 'Side quest' });

    const first = buildQuestGraph({ questDir, cacheTtlMs: 60_000 });
    const second = buildQuestGraph({ questDir, cacheTtlMs: 60_000 });

    expect(second).toBe(first);
  });

  it('forces rebuild when requested', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', { title: 'Root quest' });
    writeQuest(questDir, 'exploration/side.json', { title: 'Side quest' });

    const cached = buildQuestGraph({ questDir, cacheTtlMs: 60_000 });
    const rebuilt = buildQuestGraph({
      questDir,
      cacheTtlMs: 60_000,
      forceRebuild: true,
    });

    expect(rebuilt).not.toBe(cached);
    expect(rebuilt.nodes).toEqual(cached.nodes);
    expect(rebuilt.edges).toEqual(cached.edges);
    expect(rebuilt.diagnostics).toEqual(cached.diagnostics);
  });
});

describe('production quest directory', () => {
  it('finds at least 1 quest file when using default questDir', () => {
    // Build quest graph with default directory
    const graph = buildQuestGraph();

    // Should find at least one quest
    expect(graph.nodes.length).toBeGreaterThan(0);
  });

  it('finds the root quest welcome/howtodoquests.json', () => {
    const graph = buildQuestGraph();

    // Should include the root quest
    const rootQuest = graph.nodes.find(
      (node) => node.canonicalKey === 'welcome/howtodoquests.json'
    );
    expect(rootQuest).toBeDefined();
    expect(rootQuest?.basename).toBe('howtodoquests.json');
  });

  it('produces deterministic ordering across multiple calls', () => {
    const graph1 = buildQuestGraph();
    const graph2 = buildQuestGraph();

    // Node ordering should be identical
    expect(graph1.nodes.map((n) => n.canonicalKey)).toEqual(
      graph2.nodes.map((n) => n.canonicalKey)
    );
  });
});
