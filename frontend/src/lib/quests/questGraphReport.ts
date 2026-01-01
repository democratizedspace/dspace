import type { QuestGraph, QuestNode } from './questGraph';

const ROOT_CANONICAL_KEY = 'welcome/howtodoquests.json';
const comparatorKeys: Array<keyof QuestNode> = ['group', 'title', 'canonicalKey'];

type DiagnosticsReportOptions = {
    timestamp?: string;
    includeMultiParent?: boolean;
    multiParentLimit?: number;
};

type DiagnosticsView = {
    rootKey: string;
    missingRefs: QuestGraph['diagnostics']['missingRefs'];
    ambiguousRefs: QuestGraph['diagnostics']['ambiguousRefs'];
    unreachableNodes: string[];
    cycles: string[][];
    multiParentQuests: Array<{
        canonicalKey: string;
        title: string;
        requires: string[];
        requiresCount: number;
    }>;
    counts: {
        missingRefs: number;
        ambiguousRefs: number;
        unreachableNodes: number;
        cycles: number;
        multiParentQuests: number;
    };
};

type DiagnosticsReport = DiagnosticsView & {
    timestamp: string;
};

const compareNodes = (a?: QuestNode, b?: QuestNode): number => {
    if (!a || !b) {
        return a ? -1 : b ? 1 : 0;
    }

    for (const key of comparatorKeys) {
        if (a[key] < b[key]) return -1;
        if (a[key] > b[key]) return 1;
    }

    return 0;
};

const sortKeys = (keys: string[], byKey: Record<string, QuestNode>): string[] =>
    [...keys].sort((a, b) => compareNodes(byKey[a], byKey[b]));

const sortMissing = (entries: DiagnosticsView['missingRefs'], byKey: Record<string, QuestNode>) =>
    [...entries].sort((a, b) => {
        const fromCompare = compareNodes(byKey[a.from], byKey[b.from]);
        if (fromCompare !== 0) return fromCompare;
        return a.ref.localeCompare(b.ref);
    });

const sortAmbiguous = (
    entries: DiagnosticsView['ambiguousRefs'],
    byKey: Record<string, QuestNode>
) =>
    [...entries].sort((a, b) => {
        const fromCompare = compareNodes(byKey[a.from], byKey[b.from]);
        if (fromCompare !== 0) return fromCompare;
        return a.ref.localeCompare(b.ref);
    });

const sortCycles = (cycles: string[][], byKey: Record<string, QuestNode>) =>
    [...cycles]
        .map((cycle) => [...cycle])
        .sort((a, b) => {
            const aSignature = a.join('->');
            const bSignature = b.join('->');
            if (aSignature === bSignature) return 0;
            return aSignature < bSignature ? -1 : 1;
        })
        .map((cycle) => {
            if (cycle.length === 0) return cycle;
            const withoutClosure = cycle.slice(0, -1);
            if (withoutClosure.length === 0) return cycle;

            const smallestIndex = withoutClosure.reduce((bestIndex, key, index) => {
                const comparison = compareNodes(
                    byKey[key],
                    byKey[withoutClosure[bestIndex] ?? key]
                );
                return comparison < 0 ? index : bestIndex;
            }, 0);

            const rotated = [
                ...withoutClosure.slice(smallestIndex),
                ...withoutClosure.slice(0, smallestIndex),
            ];
            return [...rotated, rotated[0]];
        });

export const resolveRootKey = (graph?: QuestGraph): string => {
    if (!graph) return '';
    const { byKey, nodes } = graph;

    if (byKey?.[ROOT_CANONICAL_KEY]) return ROOT_CANONICAL_KEY;

    const sortedNodes = [...(nodes ?? [])].sort(compareNodes);
    const howToMatches = sortedNodes.filter(
        (node) => node.canonicalKey.split('/').pop() === 'howtodoquests.json'
    );
    if (howToMatches.length === 1) {
        return howToMatches[0].canonicalKey;
    }

    return sortedNodes[0]?.canonicalKey ?? '';
};

export const getDiagnosticsView = (
    graph: QuestGraph,
    options: DiagnosticsReportOptions = {}
): DiagnosticsView => {
    const includeMultiParent = options.includeMultiParent ?? true;
    const multiParentLimit = options.multiParentLimit ?? 20;
    const byKey = graph.byKey ?? {};
    const rootKey = resolveRootKey(graph);

    const missingRefs = sortMissing(graph.diagnostics.missingRefs ?? [], byKey);
    const ambiguousRefs = sortAmbiguous(graph.diagnostics.ambiguousRefs ?? [], byKey).map(
        (entry) => ({
            ...entry,
            candidates: sortKeys(entry.candidates ?? [], byKey),
        })
    );
    const unreachableNodes = sortKeys(graph.diagnostics.unreachableNodes ?? [], byKey);
    const cycles = sortCycles(graph.diagnostics.cycles ?? [], byKey);

    const multiParentQuests = includeMultiParent
        ? [...(graph.nodes ?? [])]
              .filter((node) => (node.requires?.length ?? 0) > 1)
              .map((node) => ({
                  canonicalKey: node.canonicalKey,
                  title: node.title,
                  requires: sortKeys(node.requires ?? [], byKey),
                  requiresCount: node.requires?.length ?? 0,
              }))
              .sort((a, b) => {
                  if (a.requiresCount !== b.requiresCount) {
                      return b.requiresCount - a.requiresCount;
                  }
                  return compareNodes(byKey[a.canonicalKey], byKey[b.canonicalKey]);
              })
              .slice(0, multiParentLimit)
        : [];

    return {
        rootKey,
        missingRefs,
        ambiguousRefs,
        unreachableNodes,
        cycles,
        multiParentQuests,
        counts: {
            missingRefs: missingRefs.length,
            ambiguousRefs: ambiguousRefs.length,
            unreachableNodes: unreachableNodes.length,
            cycles: cycles.length,
            multiParentQuests: multiParentQuests.length,
        },
    };
};

export const buildDiagnosticsReport = (
    graph: QuestGraph,
    options: DiagnosticsReportOptions = {}
): DiagnosticsReport => {
    const timestamp = options.timestamp ?? new Date().toISOString();
    const view = getDiagnosticsView(graph, options);

    return {
        timestamp,
        ...view,
    };
};

export const formatDiagnosticsReport = (
    graph: QuestGraph,
    options: DiagnosticsReportOptions = {}
): string => {
    const report = buildDiagnosticsReport(graph, options);
    return JSON.stringify(report, null, 2);
};
