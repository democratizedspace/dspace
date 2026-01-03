import { formatQuestGraphSnapshot } from '../src/lib/quests/questGraphDiagnostics';
import type {
    QuestDiagnostics,
    QuestEdge,
    QuestGraph,
    QuestNode,
} from '../src/lib/quests/questGraph';

const buildGraph = (
    nodes: QuestNode[],
    edges: QuestEdge[],
    reachableFromRoot: string[],
    diagnostics: QuestDiagnostics
): QuestGraph => {
    const byKey = nodes.reduce<Record<string, QuestNode>>((index, node) => {
        index[node.canonicalKey] = node;
        return index;
    }, {});

    const requiredBy = edges.reduce<Record<string, string[]>>((index, edge) => {
        const list = index[edge.from] ?? [];
        list.push(edge.to);
        index[edge.from] = list;
        return index;
    }, {});

    const depthByKey = nodes.reduce<Record<string, number>>((index, node, idx) => {
        index[node.canonicalKey] = idx;
        return index;
    }, {});

    return {
        nodes,
        edges,
        byKey,
        requiredBy,
        depthByKey,
        reachableFromRoot,
        diagnostics,
    };
};

const rootNode: QuestNode = {
    canonicalKey: 'welcome/howtodoquests.json',
    title: 'How to do quests',
    group: 'welcome',
    basename: 'howtodoquests.json',
    requires: [],
};

const alphaNode: QuestNode = {
    canonicalKey: 'alpha/intro.json',
    title: 'Alpha intro',
    group: 'alpha',
    basename: 'intro.json',
    requires: ['welcome/howtodoquests.json'],
};

const betaNode = (requires: string[]): QuestNode => ({
    canonicalKey: 'beta/branch.json',
    title: 'Branch quest',
    group: 'beta',
    basename: 'branch.json',
    requires,
});

const isolatedNode: QuestNode = {
    canonicalKey: 'zeta/isolated.json',
    title: 'Isolated quest',
    group: 'zeta',
    basename: 'isolated.json',
    requires: [],
};

const baseDiagnosticsA: QuestDiagnostics = {
    missingRefs: [{ from: 'beta/branch.json', ref: 'ghost.json' }],
    ambiguousRefs: [
        {
            from: 'beta/branch.json',
            ref: 'maybe.json',
            candidates: ['welcome/howtodoquests.json', 'alpha/intro.json'],
        },
    ],
    unreachableNodes: ['zeta/isolated.json'],
    cycles: [
        ['welcome/howtodoquests.json', 'alpha/intro.json', 'welcome/howtodoquests.json'],
        ['beta/branch.json', 'alpha/intro.json', 'beta/branch.json'],
    ],
};

const baseDiagnosticsB: QuestDiagnostics = {
    missingRefs: [{ from: 'beta/branch.json', ref: 'ghost.json' }],
    ambiguousRefs: [
        {
            from: 'beta/branch.json',
            ref: 'maybe.json',
            candidates: ['alpha/intro.json', 'welcome/howtodoquests.json'],
        },
    ],
    unreachableNodes: ['zeta/isolated.json'],
    cycles: [
        ['beta/branch.json', 'alpha/intro.json', 'beta/branch.json'],
        ['welcome/howtodoquests.json', 'alpha/intro.json', 'welcome/howtodoquests.json'],
    ],
};

const edgesA: QuestEdge[] = [
    { from: 'welcome/howtodoquests.json', to: 'beta/branch.json' },
    { from: 'alpha/intro.json', to: 'beta/branch.json' },
    { from: 'welcome/howtodoquests.json', to: 'alpha/intro.json' },
];

const edgesB: QuestEdge[] = [
    { from: 'alpha/intro.json', to: 'beta/branch.json' },
    { from: 'welcome/howtodoquests.json', to: 'alpha/intro.json' },
    { from: 'welcome/howtodoquests.json', to: 'beta/branch.json' },
];

describe('formatQuestGraphSnapshot', () => {
    it('serializes graph data with deterministic ordering', () => {
        const graphA = buildGraph(
            [
                betaNode(['alpha/intro.json', 'welcome/howtodoquests.json']),
                rootNode,
                alphaNode,
                isolatedNode,
            ],
            edgesA,
            ['beta/branch.json', 'welcome/howtodoquests.json', 'alpha/intro.json'],
            baseDiagnosticsA
        );

        const graphB = buildGraph(
            [
                isolatedNode,
                alphaNode,
                betaNode(['welcome/howtodoquests.json', 'alpha/intro.json']),
                rootNode,
            ],
            edgesB,
            ['welcome/howtodoquests.json', 'alpha/intro.json', 'beta/branch.json'],
            baseDiagnosticsB
        );

        const metadata = {
            version: '1.2.3',
            generatedAt: '2024-07-04T00:00:00.000Z',
        };

        const first = formatQuestGraphSnapshot(graphA, metadata);
        const second = formatQuestGraphSnapshot(graphB, metadata);

        expect(second).toBe(first);

        const parsed = JSON.parse(first);
        expect(parsed).toEqual({
            version: '1.2.3',
            generatedAt: '2024-07-04T00:00:00.000Z',
            rootKey: 'welcome/howtodoquests.json',
            nodes: [
                {
                    canonicalKey: 'alpha/intro.json',
                    title: 'Alpha intro',
                    group: 'alpha',
                    basename: 'intro.json',
                    requires: ['welcome/howtodoquests.json'],
                },
                {
                    canonicalKey: 'beta/branch.json',
                    title: 'Branch quest',
                    group: 'beta',
                    basename: 'branch.json',
                    requires: ['alpha/intro.json', 'welcome/howtodoquests.json'],
                },
                {
                    canonicalKey: 'welcome/howtodoquests.json',
                    title: 'How to do quests',
                    group: 'welcome',
                    basename: 'howtodoquests.json',
                    requires: [],
                },
                {
                    canonicalKey: 'zeta/isolated.json',
                    title: 'Isolated quest',
                    group: 'zeta',
                    basename: 'isolated.json',
                    requires: [],
                },
            ],
            edges: [
                { from: 'alpha/intro.json', to: 'beta/branch.json' },
                { from: 'welcome/howtodoquests.json', to: 'alpha/intro.json' },
                { from: 'welcome/howtodoquests.json', to: 'beta/branch.json' },
            ],
            reachableFromRoot: [
                'alpha/intro.json',
                'beta/branch.json',
                'welcome/howtodoquests.json',
            ],
            diagnostics: {
                missingRefs: [{ from: 'beta/branch.json', ref: 'ghost.json' }],
                ambiguousRefs: [
                    {
                        from: 'beta/branch.json',
                        ref: 'maybe.json',
                        candidates: ['alpha/intro.json', 'welcome/howtodoquests.json'],
                    },
                ],
                unreachableNodes: ['zeta/isolated.json'],
                cycles: [
                    ['beta/branch.json', 'alpha/intro.json', 'beta/branch.json'],
                    [
                        'welcome/howtodoquests.json',
                        'alpha/intro.json',
                        'welcome/howtodoquests.json',
                    ],
                ],
            },
        });
    });
});
