import {
    buildDiagnosticsReport,
    resolveRootKey,
    type QuestDiagnosticsReport,
} from './questGraphDiagnostics';
import type { QuestEdge, QuestGraph, QuestNode } from './questGraph';

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

const comparatorKeys: Array<keyof QuestNode> = ['group', 'title', 'canonicalKey'];

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

const sortKeys = (graph: QuestGraph, keys: string[] = []): string[] => {
    const byKey = graph.byKey ?? {};
    return [...keys].sort((left, right) => compareNodes(byKey[left], byKey[right]));
};

const sortNodes = (graph: QuestGraph): QuestGraphSnapshotNode[] => {
    const byKey = graph.byKey ?? {};
    return [...(graph.nodes ?? [])]
        .map((node) => ({
            canonicalKey: node.canonicalKey,
            title: node.title,
            group: node.group,
            basename: node.basename,
            requires: sortKeys(graph, node.requires ?? []),
        }))
        .sort((left, right) => compareNodes(byKey[left.canonicalKey], byKey[right.canonicalKey]));
};

const sortEdges = (graph: QuestGraph): QuestEdge[] => {
    const byKey = graph.byKey ?? {};
    return [...(graph.edges ?? [])]
        .map((edge) => ({ ...edge }))
        .sort((left, right) => {
            const fromCompare = compareNodes(byKey[left.from], byKey[right.from]);
            if (fromCompare !== 0) return fromCompare;
            return compareNodes(byKey[left.to], byKey[right.to]);
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
