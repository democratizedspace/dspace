import {
    buildDiagnosticsReport,
    resolveRootKey,
    type QuestDiagnosticsReport,
} from './questGraphDiagnostics';
import type { QuestEdge, QuestGraph } from './questGraph';
import {
    compareQuestNodeKeys,
    sortQuestNodeKeys,
    sortQuestNodes,
} from './questGraphOrdering';

type SnapshotMetadata = {
    version?: string;
    buildTimestamp?: string;
};

export type QuestGraphSnapshotNode = {
    canonicalKey: string;
    title: string;
    group: string;
    basename: string;
    requires: string[];
};

export type QuestGraphSnapshot = {
    version: string;
    buildTimestamp: string;
    capturedAt: string;
    rootKey: string;
    nodes: QuestGraphSnapshotNode[];
    edges: QuestEdge[];
    diagnostics: QuestDiagnosticsReport;
};

const sortKeys = (graph: QuestGraph, keys: string[] = []): string[] => {
    const byKey = graph.byKey ?? {};
    return sortQuestNodeKeys(byKey, keys);
};

const sortNodes = (graph: QuestGraph): QuestGraphSnapshotNode[] => {
    return sortQuestNodes(graph.nodes ?? []).map((node) => ({
        canonicalKey: node.canonicalKey,
        title: node.title,
        group: node.group,
        basename: node.basename,
        requires: sortKeys(graph, node.requires ?? []),
    }));
};

const sortEdges = (graph: QuestGraph): QuestEdge[] => {
    const byKey = graph.byKey ?? {};
    return [...(graph.edges ?? [])]
        .map((edge) => ({ ...edge }))
        .sort((left, right) => {
            const fromCompare = compareQuestNodeKeys(byKey, left.from, right.from);
            if (fromCompare !== 0) return fromCompare;
            return compareQuestNodeKeys(byKey, left.to, right.to);
        });
};

export const buildQuestGraphSnapshot = (
    graph: QuestGraph,
    metadata: SnapshotMetadata = {}
): QuestGraphSnapshot => {
    const capturedAt = new Date().toISOString();

    const diagnostics = buildDiagnosticsReport(graph);

    return {
        version: metadata.version ?? 'unknown',
        buildTimestamp: metadata.buildTimestamp ?? capturedAt,
        capturedAt,
        rootKey: resolveRootKey(graph),
        nodes: sortNodes(graph),
        edges: sortEdges(graph),
        diagnostics,
    };
};

export const serializeQuestGraphSnapshot = (snapshot: QuestGraphSnapshot): string => {
    return JSON.stringify(
        {
            version: snapshot.version,
            buildTimestamp: snapshot.buildTimestamp,
            capturedAt: snapshot.capturedAt,
            rootKey: snapshot.rootKey,
            nodes: snapshot.nodes,
            edges: snapshot.edges,
            diagnostics: snapshot.diagnostics,
        },
        null,
        2
    );
};
