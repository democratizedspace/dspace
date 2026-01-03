import type { QuestDiagnostics, QuestEdge, QuestGraph, QuestNode } from './questGraph';
import { resolveRootKey, sortDiagnostics } from './questGraphDiagnostics';

type SnapshotMetadata = {
    version?: string;
    builtAt?: string;
};

export type QuestGraphSnapshotOptions = {
    metadata?: SnapshotMetadata;
};

export type QuestGraphSnapshot = {
    version: string;
    builtAt: string;
    rootKey: string;
    nodes: QuestNode[];
    edges: QuestEdge[];
    diagnostics: QuestDiagnostics;
};

const comparatorKeys: Array<keyof QuestNode> = ['group', 'title', 'canonicalKey'];

const readEnvValue = (key: string): string | undefined => {
    const metaEnv =
        typeof import.meta !== 'undefined'
            ? ((import.meta as unknown as { env?: Record<string, string> }).env ?? {})
            : {};
    const metaValue = metaEnv[key];
    if (typeof metaValue === 'string' && metaValue.trim()) {
        return metaValue;
    }

    const processValue =
        typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
    if (typeof processValue === 'string' && processValue.trim()) {
        return processValue;
    }

    return undefined;
};

const resolveVersion = (metadata?: SnapshotMetadata): string => {
    if (metadata?.version) return metadata.version;
    return readEnvValue('DSPACE_VERSION') ?? readEnvValue('npm_package_version') ?? 'unknown';
};

const resolveBuildTimestamp = (metadata?: SnapshotMetadata): string => {
    if (metadata?.builtAt) return metadata.builtAt;
    return (
        readEnvValue('DSPACE_BUILD_TIMESTAMP') ??
        readEnvValue('BUILD_TIMESTAMP') ??
        new Date().toISOString()
    );
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

const compareKeys = (left: string, right: string, nodeIndex: Map<string, QuestNode>): number => {
    return compareNodes(nodeIndex.get(left), nodeIndex.get(right));
};

const sortKeys = (keys: string[], nodeIndex: Map<string, QuestNode>): string[] => {
    return [...keys].sort((left, right) => compareKeys(left, right, nodeIndex));
};

const normalizeNodes = (graph: QuestGraph, nodeIndex: Map<string, QuestNode>): QuestNode[] =>
    [...(graph.nodes ?? [])]
        .map((node) => ({
            ...node,
            requires: sortKeys(node.requires ?? [], nodeIndex),
        }))
        .sort(compareNodes);

const normalizeEdges = (graph: QuestGraph, nodeIndex: Map<string, QuestNode>): QuestEdge[] =>
    [...(graph.edges ?? [])]
        .map((edge) => ({ ...edge }))
        .sort((left, right) => {
            const fromDiff = compareKeys(left.from, right.from, nodeIndex);
            if (fromDiff !== 0) return fromDiff;
            return compareKeys(left.to, right.to, nodeIndex);
        });

export const buildQuestGraphSnapshot = (
    graph: QuestGraph,
    options: QuestGraphSnapshotOptions = {}
): QuestGraphSnapshot => {
    const nodeIndex = new Map<string, QuestNode>(
        Object.entries(graph.byKey ?? {}).map(([key, value]) => [key, value])
    );

    const nodes = normalizeNodes(graph, nodeIndex);
    const edges = normalizeEdges(graph, nodeIndex);
    const diagnostics = sortDiagnostics(graph);

    return {
        version: resolveVersion(options.metadata),
        builtAt: resolveBuildTimestamp(options.metadata),
        rootKey: resolveRootKey(graph),
        nodes,
        edges,
        diagnostics,
    };
};

export const serializeQuestGraph = (
    graph: QuestGraph,
    options: QuestGraphSnapshotOptions = {}
): string => {
    const snapshot = buildQuestGraphSnapshot(graph, options);
    return JSON.stringify(snapshot, null, 2);
};
