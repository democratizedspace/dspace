import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as glob from 'glob';

export type QuestNode = {
    canonicalKey: string;
    title: string;
    group: string;
    basename: string;
    requires: string[];
};

export type QuestEdge = {
    from: string;
    to: string;
};

export type QuestDiagnostics = {
    missingRefs: { from: string; ref: string }[];
    ambiguousRefs: { from: string; ref: string; candidates: string[] }[];
    unreachableNodes: string[];
    cycles: string[][];
};

export type QuestGraph = {
    nodes: QuestNode[];
    edges: QuestEdge[];
    byKey: Record<string, QuestNode>;
    requiredBy: Record<string, string[]>;
    depthByKey: Record<string, number>;
    reachableFromRoot: string[];
    diagnostics: QuestDiagnostics;
};

type BuildQuestGraphOptions = {
    questDir?: string;
};

const ROOT_CANONICAL_KEY = 'welcome/howtodoquests.json';
const ROOT_BASENAME = 'howtodoquests.json';

const QUESTS_DIR = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../pages/quests/json'
);

const comparatorKeys: Array<keyof QuestNode> = ['group', 'title', 'canonicalKey'];

const compareNodes = (a: QuestNode | undefined, b: QuestNode | undefined): number => {
    if (!a || !b) {
        return a ? -1 : b ? 1 : 0;
    }

    for (const key of comparatorKeys) {
        if (a[key] < b[key]) return -1;
        if (a[key] > b[key]) return 1;
    }

    return 0;
};

const compareKeys = (a: string, b: string, nodeIndex: Map<string, QuestNode>): number => {
    return compareNodes(nodeIndex.get(a), nodeIndex.get(b));
};

const normalizeRef = (ref: string): string =>
    path.posix.normalize(ref.trim().replace(/\\/g, '/').replace(/^\/+/, ''));

const toCanonicalKey = (questDir: string, absolutePath: string): string => {
    const relative = path.relative(questDir, absolutePath).replace(/\\/g, '/');
    return path.posix.normalize(relative);
};

const makeRecord = <T>(map: Map<string, T>): Record<string, T> => {
    const record: Record<string, T> = {};
    for (const [key, value] of map) {
        record[key] = value;
    }
    return record;
};

export const buildQuestGraph = (options: BuildQuestGraphOptions = {}): QuestGraph => {
    const questDir = options.questDir ?? QUESTS_DIR;
    const diagnostics: QuestDiagnostics = {
        missingRefs: [],
        ambiguousRefs: [],
        unreachableNodes: [],
        cycles: [],
    };

    const questFiles = glob.sync('**/*.json', { cwd: questDir, absolute: true }).sort();
    const nodes: QuestNode[] = [];
    const nodeIndex = new Map<string, QuestNode>();
    const rawRequiresIndex = new Map<string, string[]>();
    const byBasename = new Map<string, string[]>();
    const byQuestId = new Map<string, string>();

    for (const file of questFiles) {
        const raw = fs.readFileSync(file, 'utf8');
        const quest = JSON.parse(raw);
        const canonicalKey = toCanonicalKey(questDir, file);
        const basename = path.posix.basename(canonicalKey);
        const group = canonicalKey.split('/')[0] ?? '';
        const title =
            typeof quest.title === 'string' && quest.title.trim().length > 0
                ? quest.title
                : basename;

        const node: QuestNode = {
            canonicalKey,
            title,
            group,
            basename,
            requires: [],
        };

        nodes.push(node);
        nodeIndex.set(canonicalKey, node);

        const baseList = byBasename.get(basename) ?? [];
        baseList.push(canonicalKey);
        byBasename.set(basename, baseList);

        if (typeof quest.id === 'string' && quest.id.trim()) {
            const normalizedId = normalizeRef(quest.id);
            if (!byQuestId.has(normalizedId)) {
                byQuestId.set(normalizedId, canonicalKey);
            }
        }

        const requiresQuests = Array.isArray(quest.requiresQuests) ? quest.requiresQuests : [];
        rawRequiresIndex.set(canonicalKey, requiresQuests);
    }

    nodes.sort(compareNodes);
    for (const [, list] of byBasename) {
        list.sort((a, b) => compareKeys(a, b, nodeIndex));
    }

    const edges: QuestEdge[] = [];
    const requiredBy = new Map<string, string[]>();
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
        const rawRequires = rawRequiresIndex.get(node.canonicalKey) ?? [];
        const resolved = new Set<string>();

        for (const ref of rawRequires) {
            const normalizedRef = normalizeRef(ref);
            let target: string | undefined;

            if (nodeIndex.has(normalizedRef)) {
                target = normalizedRef;
            } else {
                const normalizedPath = path.posix.normalize(normalizedRef);
                if (nodeIndex.has(normalizedPath)) {
                    target = normalizedPath;
                }
            }

            if (!target && byQuestId.has(normalizedRef)) {
                target = byQuestId.get(normalizedRef);
            }

            if (!target) {
                const candidates = byBasename.get(path.posix.basename(normalizedRef));
                if (candidates && candidates.length === 1) {
                    target = candidates[0];
                } else if (candidates && candidates.length > 1) {
                    diagnostics.ambiguousRefs.push({
                        from: node.canonicalKey,
                        ref,
                        candidates: [...candidates],
                    });
                    continue;
                }
            }

            if (!target) {
                diagnostics.missingRefs.push({ from: node.canonicalKey, ref });
                continue;
            }

            resolved.add(target);
        }

        const resolvedList = Array.from(resolved);
        resolvedList.sort((a, b) => compareKeys(a, b, nodeIndex));
        node.requires = resolvedList;

        for (const requireKey of resolvedList) {
            edges.push({ from: requireKey, to: node.canonicalKey });

            const reverseList = requiredBy.get(requireKey) ?? [];
            reverseList.push(node.canonicalKey);
            requiredBy.set(requireKey, reverseList);

            const out = adjacency.get(requireKey) ?? [];
            out.push(node.canonicalKey);
            adjacency.set(requireKey, out);
        }
    }

    edges.sort((a, b) => {
        const fromCompare = compareKeys(a.from, b.from, nodeIndex);
        if (fromCompare !== 0) return fromCompare;
        return compareKeys(a.to, b.to, nodeIndex);
    });

    for (const [, list] of requiredBy) {
        list.sort((a, b) => compareKeys(a, b, nodeIndex));
    }
    for (const [, list] of adjacency) {
        list.sort((a, b) => compareKeys(a, b, nodeIndex));
    }

    const rootKey = (() => {
        if (nodeIndex.has(ROOT_CANONICAL_KEY)) return ROOT_CANONICAL_KEY;

        const candidates = byBasename.get(ROOT_BASENAME) ?? [];
        if (candidates.length === 1) return candidates[0];
        if (candidates.length === 0) {
            diagnostics.missingRefs.push({ from: '<root>', ref: ROOT_BASENAME });
            throw new Error('Quest root not found');
        }

        diagnostics.ambiguousRefs.push({
            from: '<root>',
            ref: ROOT_BASENAME,
            candidates: [...candidates],
        });
        throw new Error('Quest root is ambiguous');
    })();

    const reachableFromRoot = new Set<string>();
    const queue: string[] = [rootKey];

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current || reachableFromRoot.has(current)) continue;

        reachableFromRoot.add(current);
        const children = adjacency.get(current) ?? [];
        for (const child of children) {
            if (!reachableFromRoot.has(child)) {
                queue.push(child);
            }
        }
    }

    diagnostics.unreachableNodes = nodes
        .filter((node) => !reachableFromRoot.has(node.canonicalKey))
        .map((node) => node.canonicalKey);

    const cycles: string[][] = [];
    const cycleSet = new Set<string>();
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const stack: string[] = [];

    const visit = (key: string) => {
        if (visiting.has(key)) return;
        if (visited.has(key)) return;

        visiting.add(key);
        stack.push(key);
        const neighbors = adjacency.get(key) ?? [];

        for (const neighbor of neighbors) {
            if (!reachableFromRoot.has(neighbor)) continue;

            if (visiting.has(neighbor)) {
                const startIndex = stack.indexOf(neighbor);
                if (startIndex !== -1) {
                    const cyclePath = [...stack.slice(startIndex), neighbor];
                    const signature = cyclePath.join('->');
                    if (!cycleSet.has(signature)) {
                        cycleSet.add(signature);
                        cycles.push(cyclePath);
                    }
                }
                continue;
            }

            if (!visited.has(neighbor)) {
                visit(neighbor);
            }
        }

        stack.pop();
        visiting.delete(key);
        visited.add(key);
    };

    const reachableList = Array.from(reachableFromRoot).sort((a, b) =>
        compareKeys(a, b, nodeIndex)
    );
    const traversalOrder = [rootKey, ...reachableList.filter((key) => key !== rootKey)];
    for (const key of traversalOrder) {
        if (!visited.has(key)) {
            visit(key);
        }
    }

    diagnostics.cycles = cycles;

    const feedbackEdges = new Set<string>();
    for (const cycle of cycles) {
        const pairs: string[] = [];
        for (let i = 0; i < cycle.length - 1; i += 1) {
            pairs.push(`${cycle[i]}->${cycle[i + 1]}`);
        }
        if (pairs.length > 0) {
            pairs.sort();
            feedbackEdges.add(pairs[pairs.length - 1]);
        }
    }

    const filteredAdjacency = new Map<string, string[]>();
    const indegree = new Map<string, number>();
    nodes.forEach((node) => indegree.set(node.canonicalKey, 0));

    for (const edge of edges) {
        const key = `${edge.from}->${edge.to}`;
        if (feedbackEdges.has(key)) continue;

        indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
        const out = filteredAdjacency.get(edge.from) ?? [];
        out.push(edge.to);
        filteredAdjacency.set(edge.from, out);
    }

    for (const [, list] of filteredAdjacency) {
        list.sort((a, b) => compareKeys(a, b, nodeIndex));
    }

    const depthByKey = new Map<string, number>();
    const topoQueue = nodes
        .filter((node) => (indegree.get(node.canonicalKey) ?? 0) === 0)
        .map((node) => node.canonicalKey);

    topoQueue.sort((a, b) => compareKeys(a, b, nodeIndex));

    while (topoQueue.length > 0) {
        const current = topoQueue.shift() as string;
        const currentDepth = depthByKey.get(current) ?? 0;
        const neighbors = filteredAdjacency.get(current) ?? [];

        for (const neighbor of neighbors) {
            const nextDepth = Math.max(currentDepth + 1, depthByKey.get(neighbor) ?? 0);
            depthByKey.set(neighbor, nextDepth);

            const nextIndegree = (indegree.get(neighbor) ?? 0) - 1;
            indegree.set(neighbor, nextIndegree);
            if (nextIndegree === 0) {
                topoQueue.push(neighbor);
                topoQueue.sort((a, b) => compareKeys(a, b, nodeIndex));
            }
        }
    }

    for (const node of nodes) {
        if (!depthByKey.has(node.canonicalKey)) {
            depthByKey.set(node.canonicalKey, 0);
        }
    }

    return {
        nodes,
        edges,
        byKey: makeRecord(nodeIndex),
        requiredBy: makeRecord(requiredBy),
        depthByKey: makeRecord(depthByKey),
        reachableFromRoot: reachableList,
        diagnostics,
    };
};
