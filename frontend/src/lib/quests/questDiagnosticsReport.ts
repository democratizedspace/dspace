import {
    compareQuestKeys,
    compareQuestNodes,
    resolveQuestGraphRoot,
    sortQuestKeys,
} from './questGraphClient';
import type { QuestDiagnostics, QuestGraph, QuestNode } from './questGraph';

type MultiParentEntry = {
    canonicalKey: string;
    title: string;
    requires: string[];
    requiresCount: number;
};

export type QuestDiagnosticsReport = {
    timestamp: string;
    root: string;
    counts: {
        missingRefs: number;
        ambiguousRefs: number;
        unreachable: number;
        cycles: number;
    };
    missingRefs: QuestDiagnostics['missingRefs'];
    ambiguousRefs: QuestDiagnostics['ambiguousRefs'];
    unreachable: string[];
    cycles: string[][];
    multiParentTop?: MultiParentEntry[];
};

export type BuildReportOptions = {
    includeMultiParentTop?: boolean;
    multiParentLimit?: number;
    timestamp?: string | number | Date;
};

const normalizeCycle = (cycle: string[], graph: QuestGraph): string[] => {
    if (!cycle.length) return [];
    const smallestIndex = cycle.reduce((bestIndex, key, index) => {
        const comparison = compareQuestKeys(key, cycle[bestIndex], graph);
        return comparison < 0 ? index : bestIndex;
    }, 0);
    const normalized = [...cycle.slice(smallestIndex), ...cycle.slice(0, smallestIndex)];
    return normalized;
};

const sortCycles = (cycles: string[][], graph: QuestGraph): string[][] => {
    const normalized = cycles.map((cycle) => normalizeCycle(cycle, graph));
    normalized.sort((a, b) => a.join(' -> ').localeCompare(b.join(' -> ')));
    return normalized;
};

const sortMissingRefs = (diagnostics: QuestDiagnostics, graph: QuestGraph) =>
    [...(diagnostics.missingRefs ?? [])].sort((a, b) => {
        const fromComparison = compareQuestKeys(a.from, b.from, graph);
        if (fromComparison !== 0) return fromComparison;
        return a.ref.localeCompare(b.ref);
    });

const sortAmbiguousRefs = (diagnostics: QuestDiagnostics, graph: QuestGraph) =>
    [...(diagnostics.ambiguousRefs ?? [])]
        .map((entry) => ({
            ...entry,
            candidates: sortQuestKeys(entry.candidates ?? [], graph),
        }))
        .sort((a, b) => {
            const fromComparison = compareQuestKeys(a.from, b.from, graph);
            if (fromComparison !== 0) return fromComparison;
            return a.ref.localeCompare(b.ref);
        });

const findMultiParents = (
    graph: QuestGraph,
    limit: number,
    comparator: (a: QuestNode | undefined, b: QuestNode | undefined) => number
): MultiParentEntry[] => {
    const nodes = graph.nodes ?? [];
    const candidates = nodes.filter((node) => (node.requires?.length ?? 0) > 1);
    candidates.sort((a, b) => {
        const requireDiff = (b.requires?.length ?? 0) - (a.requires?.length ?? 0);
        if (requireDiff !== 0) return requireDiff;
        return comparator(a, b);
    });
    return candidates.slice(0, limit).map((node) => ({
        canonicalKey: node.canonicalKey,
        title: node.title,
        requires: sortQuestKeys(node.requires ?? [], graph),
        requiresCount: node.requires?.length ?? 0,
    }));
};

export const buildQuestDiagnosticsReport = (
    graph: QuestGraph,
    options: BuildReportOptions = {}
): QuestDiagnosticsReport => {
    const timestamp = options.timestamp
        ? new Date(options.timestamp).toISOString()
        : new Date().toISOString();
    const root = resolveQuestGraphRoot(graph);
    const missingRefs = sortMissingRefs(graph.diagnostics, graph);
    const ambiguousRefs = sortAmbiguousRefs(graph.diagnostics, graph);
    const unreachable = sortQuestKeys(graph.diagnostics.unreachableNodes ?? [], graph);
    const cycles = sortCycles(graph.diagnostics.cycles ?? [], graph);

    const report: QuestDiagnosticsReport = {
        timestamp,
        root,
        counts: {
            missingRefs: missingRefs.length,
            ambiguousRefs: ambiguousRefs.length,
            unreachable: unreachable.length,
            cycles: cycles.length,
        },
        missingRefs,
        ambiguousRefs,
        unreachable,
        cycles,
    };

    if (options.includeMultiParentTop !== false) {
        const multiParentTop = findMultiParents(
            graph,
            options.multiParentLimit ?? 20,
            compareQuestNodes
        );
        if (multiParentTop.length > 0) {
            report.multiParentTop = multiParentTop;
        }
    }

    return report;
};
