import type { QuestDiagnostics, QuestGraph, QuestNode } from './questGraph';

type BuildReportOptions = {
    timestamp?: string;
    multiParentLimit?: number;
};

type DiagnosticsReport = {
    timestamp: string;
    root: string;
    counts: {
        missingRefs: number;
        ambiguousRefs: number;
        unreachableNodes: number;
        cycles: number;
        multiParent: number;
    };
    diagnostics: QuestDiagnostics;
    multiParentTop: Array<{
        canonicalKey: string;
        title: string;
        requires: string[];
    }>;
};

const ROOT_KEY = 'welcome/howtodoquests.json';
const ROOT_BASENAME = 'howtodoquests.json';
const DEFAULT_MULTI_PARENT_LIMIT = 20;

const toNodeIndex = (nodes: QuestNode[]): Map<string, QuestNode> => {
    const index = new Map<string, QuestNode>();
    for (const node of nodes) {
        index.set(node.canonicalKey, node);
    }
    return index;
};

const sortKeys = (keys: string[], nodeIndex: Map<string, QuestNode>): string[] => {
    return [...keys].sort((a, b) => questKeyComparator(a, b, nodeIndex));
};

const sortNodes = (nodes: QuestNode[]): QuestNode[] => {
    return [...nodes].sort(questNodeComparator);
};

const sortMissingRefs = (
    missingRefs: QuestDiagnostics['missingRefs'],
    nodeIndex: Map<string, QuestNode>
) => {
    return [...missingRefs].sort((a, b) => {
        const fromCompare = questKeyComparator(a.from, b.from, nodeIndex);
        if (fromCompare !== 0) return fromCompare;
        return a.ref.localeCompare(b.ref);
    });
};

const sortAmbiguousRefs = (
    ambiguousRefs: QuestDiagnostics['ambiguousRefs'],
    nodeIndex: Map<string, QuestNode>
) => {
    return [...ambiguousRefs]
        .map((entry) => {
            return {
                ...entry,
                candidates: sortKeys(entry.candidates, nodeIndex),
            };
        })
        .sort((a, b) => {
            const fromCompare = questKeyComparator(a.from, b.from, nodeIndex);
            if (fromCompare !== 0) return fromCompare;
            return a.ref.localeCompare(b.ref);
        });
};

const rotateCycle = (cycle: string[], nodeIndex: Map<string, QuestNode>): string[] => {
    if (cycle.length === 0) return [];
    const openCycle = cycle.slice(0, -1);
    if (openCycle.length === 0) return [...cycle];

    const start = openCycle.reduce((best, key) => {
        return questKeyComparator(key, best, nodeIndex) < 0 ? key : best;
    }, openCycle[0]);
    const startIndex = openCycle.indexOf(start);
    const rotated = [...openCycle.slice(startIndex), ...openCycle.slice(0, startIndex)];
    const closing = rotated[0];
    return [...rotated, closing];
};

const sortCycles = (cycles: string[][], nodeIndex: Map<string, QuestNode>): string[][] => {
    const normalized = cycles.map((cycle) => rotateCycle(cycle, nodeIndex));
    return normalized.sort((a, b) => a.join('->').localeCompare(b.join('->')));
};

const sortDiagnostics = (
    diagnostics: QuestDiagnostics,
    nodeIndex: Map<string, QuestNode>
): QuestDiagnostics => {
    return {
        missingRefs: sortMissingRefs(diagnostics.missingRefs, nodeIndex),
        ambiguousRefs: sortAmbiguousRefs(diagnostics.ambiguousRefs, nodeIndex),
        unreachableNodes: sortKeys(diagnostics.unreachableNodes, nodeIndex),
        cycles: sortCycles(diagnostics.cycles, nodeIndex),
    };
};

export const resolveRootKey = (graph: QuestGraph): string => {
    const { byKey, nodes } = graph;
    if (byKey[ROOT_KEY]) {
        return ROOT_KEY;
    }

    const nodeIndex = toNodeIndex(nodes);
    const sortedNodes = sortNodes(nodes);
    const howToMatches = sortedNodes.filter(
        (node) => node.canonicalKey.split('/').pop() === ROOT_BASENAME
    );

    if (howToMatches.length === 1) {
        return howToMatches[0].canonicalKey;
    }

    return sortedNodes[0]?.canonicalKey ?? '';
};

const buildMultiParentTop = (
    nodes: QuestNode[],
    nodeIndex: Map<string, QuestNode>,
    limit: number
) => {
    const multiParentNodes = nodes.filter((node) => (node.requires?.length ?? 0) > 1);
    multiParentNodes.sort((a, b) => {
        const countDiff = (b.requires?.length ?? 0) - (a.requires?.length ?? 0);
        if (countDiff !== 0) return countDiff;
        return questNodeComparator(a, b);
    });

    return {
        total: multiParentNodes.length,
        list: multiParentNodes.slice(0, limit).map((node) => ({
            canonicalKey: node.canonicalKey,
            title: node.title,
            requires: sortKeys(node.requires ?? [], nodeIndex),
        })),
    };
};

export const buildDiagnosticsReport = (
    graph: QuestGraph,
    options: BuildReportOptions = {}
): DiagnosticsReport => {
    const timestamp = options.timestamp ?? new Date().toISOString();
    const nodeIndex = toNodeIndex(graph.nodes);
    const sortedDiagnostics = sortDiagnostics(graph.diagnostics, nodeIndex);
    const root = resolveRootKey(graph);
    const multiParentLimit = options.multiParentLimit ?? DEFAULT_MULTI_PARENT_LIMIT;
    const multiParent = buildMultiParentTop(graph.nodes, nodeIndex, multiParentLimit);

    return {
        timestamp,
        root,
        counts: {
            missingRefs: sortedDiagnostics.missingRefs.length,
            ambiguousRefs: sortedDiagnostics.ambiguousRefs.length,
            unreachableNodes: sortedDiagnostics.unreachableNodes.length,
            cycles: sortedDiagnostics.cycles.length,
            multiParent: multiParent.total,
        },
        diagnostics: sortedDiagnostics,
        multiParentTop: multiParent.list,
    };
};

export const formatDiagnosticsReport = (
    graph: QuestGraph,
    options: BuildReportOptions = {}
): string => {
    const report = buildDiagnosticsReport(graph, options);
    return JSON.stringify(report, null, 2);
};
const comparatorKeys: Array<keyof QuestNode> = ['group', 'title', 'canonicalKey'];

const questNodeComparator = (a: QuestNode | undefined, b: QuestNode | undefined): number => {
    if (!a || !b) {
        return a ? -1 : b ? 1 : 0;
    }

    for (const key of comparatorKeys) {
        if (a[key] < b[key]) return -1;
        if (a[key] > b[key]) return 1;
    }

    return 0;
};

const questKeyComparator = (a: string, b: string, nodeIndex: Map<string, QuestNode>): number => {
    return questNodeComparator(nodeIndex.get(a), nodeIndex.get(b));
};
