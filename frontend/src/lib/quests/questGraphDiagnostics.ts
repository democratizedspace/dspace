import type { QuestDiagnostics, QuestGraph, QuestNode } from './questGraph';
import {
    compareQuestNodeKeys,
    compareQuestNodes,
    sortQuestNodeKeys,
    sortQuestNodes,
} from './questGraphOrdering';

const ROOT_KEY = 'welcome/howtodoquests.json';

const compareKeys = (graph: QuestGraph, a?: string, b?: string): number => {
    const byKey = graph.byKey ?? {};
    return compareQuestNodeKeys(byKey, a, b);
};

const sortKeys = (graph: QuestGraph, keys: string[] = []): string[] => {
    const byKey = graph.byKey ?? {};
    return sortQuestNodeKeys(byKey, keys);
};

const sortNodes = (graph: QuestGraph): QuestNode[] => {
    return sortQuestNodes(graph.nodes ?? []);
};

const sortKeyLists = (graph: QuestGraph, left: string[], right: string[]): number => {
    const maxIndex = Math.min(left.length, right.length);
    for (let index = 0; index < maxIndex; index += 1) {
        const diff = compareKeys(graph, left[index], right[index]);
        if (diff !== 0) return diff;
    }
    return left.length - right.length;
};

const sortMissingRefs = (
    graph: QuestGraph,
    diagnostics: QuestDiagnostics
): QuestDiagnostics['missingRefs'] => {
    const issues = diagnostics.missingRefs ?? [];
    return [...issues]
        .map((issue) => ({ ...issue }))
        .sort(
            (left, right) =>
                compareKeys(graph, left.from, right.from) || left.ref.localeCompare(right.ref)
        );
};

const sortAmbiguousRefs = (
    graph: QuestGraph,
    diagnostics: QuestDiagnostics
): QuestDiagnostics['ambiguousRefs'] => {
    const issues = diagnostics.ambiguousRefs ?? [];
    return [...issues]
        .map((issue) => ({
            ...issue,
            candidates: sortKeys(graph, issue.candidates ?? []),
        }))
        .sort((left, right) => {
            const baseCompare =
                compareKeys(graph, left.from, right.from) || left.ref.localeCompare(right.ref);
            if (baseCompare !== 0) return baseCompare;
            if (left.candidates.length !== right.candidates.length) {
                return left.candidates.length - right.candidates.length;
            }
            return sortKeyLists(graph, left.candidates, right.candidates);
        });
};

const sortCycles = (graph: QuestGraph, diagnostics: QuestDiagnostics): string[][] => {
    const cycles = diagnostics.cycles ?? [];
    return [...cycles]
        .map((cycle) => [...cycle])
        .sort((left, right) => sortKeyLists(graph, left, right));
};

const getMultiParentNodes = (graph: QuestGraph) => {
    const nodes = graph.nodes ?? [];
    const multiParents = nodes.filter((node) => (node.requires?.length ?? 0) > 1);

    multiParents.sort((left, right) => {
        const diff = (right.requires?.length ?? 0) - (left.requires?.length ?? 0);
        if (diff !== 0) return diff;
        return compareQuestNodes(left, right);
    });

    return multiParents.slice(0, 20).map((node) => ({
        canonicalKey: node.canonicalKey,
        title: node.title,
        requires: sortKeys(graph, node.requires ?? []),
        requiresCount: node.requires?.length ?? 0,
    }));
};

export const resolveRootKey = (graph: QuestGraph): string => {
    const byKey = graph.byKey ?? {};
    if (byKey[ROOT_KEY]) {
        return ROOT_KEY;
    }

    const nodes = sortNodes(graph);
    const howToMatches = nodes.filter(
        (node) => node.canonicalKey.split('/').pop() === 'howtodoquests.json'
    );

    if (howToMatches.length === 1) {
        return howToMatches[0].canonicalKey;
    }

    return nodes[0]?.canonicalKey ?? '';
};

export type QuestDiagnosticsReport = {
    timestamp: string;
    rootKey: string;
    counts: {
        missingRefs: number;
        ambiguousRefs: number;
        unreachableNodes: number;
        cycles: number;
        multiParent: number;
    };
    missingRefs: QuestDiagnostics['missingRefs'];
    ambiguousRefs: QuestDiagnostics['ambiguousRefs'];
    unreachableNodes: string[];
    cycles: string[][];
    multiParent: Array<{
        canonicalKey: string;
        title: string;
        requires: string[];
        requiresCount: number;
    }>;
};

export const buildDiagnosticsReport = (graph: QuestGraph): QuestDiagnosticsReport => {
    const diagnostics: QuestDiagnostics = graph.diagnostics ?? {
        missingRefs: [],
        ambiguousRefs: [],
        unreachableNodes: [],
        cycles: [],
    };

    const rootKey = resolveRootKey(graph);
    const missingRefs = sortMissingRefs(graph, diagnostics);
    const ambiguousRefs = sortAmbiguousRefs(graph, diagnostics);
    const unreachableNodes = sortKeys(graph, diagnostics.unreachableNodes ?? []);
    const cycles = sortCycles(graph, diagnostics);
    const multiParent = getMultiParentNodes(graph);

    return {
        timestamp: new Date().toISOString(),
        rootKey,
        counts: {
            missingRefs: missingRefs.length,
            ambiguousRefs: ambiguousRefs.length,
            unreachableNodes: unreachableNodes.length,
            cycles: cycles.length,
            multiParent: multiParent.length,
        },
        missingRefs,
        ambiguousRefs,
        unreachableNodes,
        cycles,
        multiParent,
    };
};

export const formatDiagnosticsReport = (graph: QuestGraph): string => {
    const report = buildDiagnosticsReport(graph);
    return JSON.stringify(report, null, 2);
};
