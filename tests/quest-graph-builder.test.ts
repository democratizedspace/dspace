import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildQuestGraph, type QuestGraph } from '../frontend/src/lib/quests/questGraph.ts';

const fixtureDir = path.join(process.cwd(), 'frontend/tests/fixtures/quest-graph');

describe('buildQuestGraph', () => {
    let graph: QuestGraph;

    beforeAll(async () => {
        graph = await buildQuestGraph(fixtureDir);
    });

    it('reports missing dependency references', () => {
        expect(graph.diagnostics.missingRefs).toContainEqual({
            from: 'alpha/missing-ref.json',
            ref: 'ghost-quest',
        });
    });

    it('reports ambiguous basename matches with all candidates', () => {
        expect(graph.diagnostics.ambiguousRefs).toContainEqual({
            from: 'alpha/needs-shared.json',
            ref: 'shared.json',
            matches: ['group-one/shared.json', 'group-two/shared.json'],
        });
    });

    it('captures cycles with a stable path', () => {
        expect(graph.diagnostics.cycles).toContainEqual([
            'cycle/a.json',
            'cycle/b.json',
            'cycle/a.json',
        ]);
    });

    it('sorts nodes deterministically', () => {
        expect(graph.nodes.map((node) => node.canonicalKey)).toEqual([
            'alpha/first.json',
            'alpha/missing-ref.json',
            'alpha/needs-shared.json',
            'cycle/a.json',
            'cycle/b.json',
            'group-one/shared.json',
            'group-two/shared.json',
            'welcome/howtodoquests.json',
        ]);
    });
});
