import { describe, expect, it, vi, afterEach } from 'vitest';
import type { QuestGraph, QuestNode } from '../src/lib/quests/questGraph';
import {
    buildQuestGraphSnapshot,
    serializeQuestGraphSnapshot,
} from '../src/lib/quests/questGraphSnapshot';

const buildGraph = (nodes: QuestNode[], diagnostics: QuestGraph['diagnostics']): QuestGraph => {
    const byKey = Object.fromEntries(nodes.map((node) => [node.canonicalKey, node]));

    return {
        nodes,
        edges: [
            { from: 'groupB/beta.json', to: 'groupA/alpha.json' },
            { from: 'groupC/gamma.json', to: 'groupA/alpha.json' },
        ],
        byKey,
        requiredBy: {},
        depthByKey: {},
        reachableFromRoot: [],
        diagnostics,
    };
};

describe('quest graph snapshot', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('serializes snapshots with stable ordering and metadata', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-02-03T04:05:06.789Z'));

        const nodes: QuestNode[] = [
            {
                canonicalKey: 'groupB/beta.json',
                title: 'Beta quest',
                group: 'groupB',
                basename: 'beta.json',
                requires: ['groupC/gamma.json'],
            },
            {
                canonicalKey: 'groupC/gamma.json',
                title: 'Gamma quest',
                group: 'groupC',
                basename: 'gamma.json',
                requires: [],
            },
            {
                canonicalKey: 'groupA/alpha.json',
                title: 'Alpha quest',
                group: 'groupA',
                basename: 'alpha.json',
                requires: ['groupB/beta.json', 'groupC/gamma.json'],
            },
        ];

        const diagnostics: QuestGraph['diagnostics'] = {
            missingRefs: [{ from: 'groupB/beta.json', ref: 'missing.json' }],
            ambiguousRefs: [
                {
                    from: 'groupB/beta.json',
                    ref: 'shared.json',
                    candidates: ['groupC/gamma.json', 'groupA/alpha.json'],
                },
            ],
            unreachableNodes: ['groupB/beta.json', 'groupA/alpha.json'],
            cycles: [['groupA/alpha.json', 'groupC/gamma.json', 'groupA/alpha.json']],
        };

        const graph = buildGraph(nodes, diagnostics);

        const snapshot = buildQuestGraphSnapshot(graph, {
            version: '3.2.1-test',
            buildTimestamp: '2025-02-02T01:00:00.000Z',
        });

        expect(snapshot.version).toBe('3.2.1-test');
        expect(snapshot.buildTimestamp).toBe('2025-02-02T01:00:00.000Z');
        expect(snapshot.capturedAt).toBe('2025-02-03T04:05:06.789Z');
        expect(snapshot.rootKey).toBe('groupA/alpha.json');

        expect(snapshot.nodes.map((node) => node.canonicalKey)).toEqual([
            'groupA/alpha.json',
            'groupB/beta.json',
            'groupC/gamma.json',
        ]);
        expect(snapshot.nodes[0]?.requires).toEqual([
            'groupB/beta.json',
            'groupC/gamma.json',
        ]);

        expect(snapshot.edges.map((edge) => `${edge.from}->${edge.to}`)).toEqual([
            'groupB/beta.json->groupA/alpha.json',
            'groupC/gamma.json->groupA/alpha.json',
        ]);

        expect(snapshot.diagnostics.timestamp).toBe('2025-02-03T04:05:06.789Z');
        expect(snapshot.diagnostics.rootKey).toBe('groupA/alpha.json');
        expect(snapshot.diagnostics.counts).toEqual({
            missingRefs: 1,
            ambiguousRefs: 1,
            unreachableNodes: 2,
            cycles: 1,
            multiParent: 1,
        });
        expect(snapshot.diagnostics.missingRefs).toEqual([
            { from: 'groupB/beta.json', ref: 'missing.json' },
        ]);
        expect(snapshot.diagnostics.ambiguousRefs).toEqual([
            {
                from: 'groupB/beta.json',
                ref: 'shared.json',
                candidates: ['groupA/alpha.json', 'groupC/gamma.json'],
            },
        ]);
        expect(snapshot.diagnostics.unreachableNodes).toEqual([
            'groupA/alpha.json',
            'groupB/beta.json',
        ]);
        expect(snapshot.diagnostics.cycles).toEqual([
            ['groupA/alpha.json', 'groupC/gamma.json', 'groupA/alpha.json'],
        ]);
        expect(snapshot.diagnostics.multiParent).toEqual([
            {
                canonicalKey: 'groupA/alpha.json',
                title: 'Alpha quest',
                requires: ['groupB/beta.json', 'groupC/gamma.json'],
                requiresCount: 2,
            },
        ]);

        const first = serializeQuestGraphSnapshot(snapshot);
        const second = serializeQuestGraphSnapshot(snapshot);
        expect(second).toBe(first);
    });
});
