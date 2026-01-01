import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    buildDiagnosticsReport,
    formatDiagnosticsReport,
} from '../src/lib/quests/questGraphDiagnostics';
import type { QuestGraph, QuestNode } from '../src/lib/quests/questGraph';

const buildGraph = (nodes: QuestNode[], diagnostics: QuestGraph['diagnostics']): QuestGraph => {
    const byKey = Object.fromEntries(nodes.map((node) => [node.canonicalKey, node]));

    return {
        nodes,
        edges: [],
        byKey,
        requiredBy: {},
        depthByKey: {},
        reachableFromRoot: [],
        diagnostics,
    };
};

describe('quest diagnostics report', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('emits deterministic, stably sorted content', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-02T03:04:05.000Z'));

        const nodes: QuestNode[] = [
            {
                canonicalKey: 'groupB/beta.json',
                title: 'Beta quest',
                group: 'groupB',
                basename: 'beta.json',
                requires: [],
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
                requires: ['groupC/gamma.json', 'groupB/beta.json'],
            },
        ];

        const diagnostics: QuestGraph['diagnostics'] = {
            missingRefs: [
                { from: 'groupB/beta.json', ref: 'missing.json' },
                { from: 'groupA/alpha.json', ref: 'zeta.json' },
            ],
            ambiguousRefs: [
                {
                    from: 'groupC/gamma.json',
                    ref: 'shared.json',
                    candidates: ['groupB/beta.json', 'groupA/alpha.json'],
                },
                {
                    from: 'groupB/beta.json',
                    ref: 'shared.json',
                    candidates: ['groupC/gamma.json', 'groupA/alpha.json'],
                },
            ],
            unreachableNodes: ['groupB/beta.json', 'groupA/alpha.json'],
            cycles: [
                ['groupC/gamma.json', 'groupB/beta.json', 'groupC/gamma.json'],
                ['groupA/alpha.json', 'groupC/gamma.json', 'groupA/alpha.json'],
            ],
        };

        const graph = buildGraph(nodes, diagnostics);

        const first = formatDiagnosticsReport(graph);
        const second = formatDiagnosticsReport(graph);

        expect(second).toBe(first);

        const parsed = buildDiagnosticsReport(graph);
        expect(parsed.timestamp).toBe('2024-01-02T03:04:05.000Z');
        expect(parsed.rootKey).toBe('groupA/alpha.json');
        expect(parsed.missingRefs.map((issue) => issue.from)).toEqual([
            'groupA/alpha.json',
            'groupB/beta.json',
        ]);
        expect(parsed.ambiguousRefs[0]?.candidates).toEqual([
            'groupA/alpha.json',
            'groupC/gamma.json',
        ]);
        expect(parsed.unreachableNodes).toEqual(['groupA/alpha.json', 'groupB/beta.json']);
        expect(parsed.cycles[0]).toEqual([
            'groupA/alpha.json',
            'groupC/gamma.json',
            'groupA/alpha.json',
        ]);
        expect(parsed.multiParent).toHaveLength(1);
        expect(parsed.multiParent[0]).toMatchObject({
            canonicalKey: 'groupA/alpha.json',
            requiresCount: 2,
        });
    });
});
