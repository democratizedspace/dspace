import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest';

import { buildQuestGraph, clearQuestGraphCache } from '../frontend/src/lib/quests/questGraph';

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

beforeEach(() => {
  clearQuestGraphCache();
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

  it('flags self-referential quests as contradictory cycles', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'loop/self.json', {
      title: 'Self loop',
      requiresQuests: ['loop/self.json'],
    });

    const graph = buildQuestGraph({ questDir });

    expect(graph.diagnostics.cycles).toEqual([['loop/self.json', 'loop/self.json']]);
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

describe('quest graph cache', () => {
  it('returns the same instance for cache hits', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', { title: 'Root' });

    const first = buildQuestGraph({ questDir, cacheTtlMs: 60_000 });
    const second = buildQuestGraph({ questDir, cacheTtlMs: 60_000 });

    expect(second).toBe(first);
  });

  it('forces rebuild when requested', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', { title: 'Root' });

    const initial = buildQuestGraph({ questDir, cacheTtlMs: 60_000 });
    writeQuest(questDir, 'alpha/added.json', { title: 'Added quest' });

    const rebuilt = buildQuestGraph({
      questDir,
      cacheTtlMs: 60_000,
      forceRebuild: true,
    });

    expect(rebuilt).not.toBe(initial);
    expect(rebuilt.nodes.map((node) => node.canonicalKey)).toContain('alpha/added.json');

    const cached = buildQuestGraph({ questDir, cacheTtlMs: 60_000 });
    expect(cached).toBe(rebuilt);
  });

  it('expires cached entries after the TTL passes', () => {
    vi.useFakeTimers();
    try {
      const questDir = createQuestDir();
      writeQuest(questDir, 'welcome/howtodoquests.json', { title: 'Root' });

      const ttlMs = 50;
      const cached = buildQuestGraph({ questDir, cacheTtlMs: ttlMs });

      vi.advanceTimersByTime(ttlMs + 1);
      const rebuilt = buildQuestGraph({ questDir, cacheTtlMs: ttlMs });

      expect(rebuilt).not.toBe(cached);
    } finally {
      vi.useRealTimers();
    }
  });

  it('disables caching when requested', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', { title: 'Root' });

    const first = buildQuestGraph({ questDir, disableCache: true });
    writeQuest(questDir, 'alpha/added.json', { title: 'Added quest' });
    const second = buildQuestGraph({ questDir, disableCache: true });

    expect(second).not.toBe(first);
    expect(second.nodes.map((node) => node.canonicalKey)).toContain('alpha/added.json');
  });

  it('honors cache=false to opt out of caching', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', { title: 'Root' });

    const first = buildQuestGraph({ questDir, cache: false });
    writeQuest(questDir, 'alpha/added.json', { title: 'Added quest' });
    const second = buildQuestGraph({ questDir, cache: false });

    expect(second).not.toBe(first);
    expect(second.nodes.map((node) => node.canonicalKey)).toContain('alpha/added.json');
  });

  it('treats cacheTtlMs of zero as uncached', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', { title: 'Root' });

    const first = buildQuestGraph({ questDir, cacheTtlMs: 0 });
    writeQuest(questDir, 'alpha/added.json', { title: 'Added quest' });
    const second = buildQuestGraph({ questDir, cacheTtlMs: 0 });

    expect(second).not.toBe(first);
    expect(second.nodes.map((node) => node.canonicalKey)).toContain('alpha/added.json');
  });

  it('rejects cache options when using preloaded quests', () => {
    expect(() =>
      buildQuestGraph({
        quests: [{ path: './json/welcome/howtodoquests.json', quest: {} }],
        cacheTtlMs: 1000,
      })
    ).toThrowError(/cache options/i);
  });

  it('preserves determinism with and without caching', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', {
      title: 'Root',
      requiresQuests: ['alpha/start.json', 'beta/start.json'],
    });
    writeQuest(questDir, 'alpha/start.json', { title: 'Alpha' });
    writeQuest(questDir, 'beta/start.json', { title: 'Beta' });

    const uncached = buildQuestGraph({ questDir, cache: false });
    const cached = buildQuestGraph({ questDir, cacheTtlMs: 10_000 });
    const cachedHit = buildQuestGraph({ questDir, cacheTtlMs: 10_000 });

    expect(cachedHit).toBe(cached);
    expect(cached.nodes.map((node) => node.canonicalKey)).toEqual(
      uncached.nodes.map((node) => node.canonicalKey)
    );
    expect(cached.diagnostics).toEqual(uncached.diagnostics);
  });

  it('returns frozen graphs to guard against mutation', () => {
    const questDir = createQuestDir();
    writeQuest(questDir, 'welcome/howtodoquests.json', { title: 'Root' });

    const graph = buildQuestGraph({ questDir, cacheTtlMs: 60_000 });

    expect(Object.isFrozen(graph)).toBe(true);
    expect(Object.isFrozen(graph.nodes)).toBe(true);
    expect(Object.isFrozen(graph.diagnostics)).toBe(true);
    expect(() => {
      (graph.nodes as unknown as Array<{ canonicalKey: string }>).push({
        canonicalKey: 'mutated.json',
      });
    }).toThrow();
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
