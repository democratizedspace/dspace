import fs from 'node:fs/promises';
import path from 'node:path';
import * as globModule from 'glob';

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
    missingRefs: { from: string; ref: string; normalizedRef: string }[];
    ambiguousRefs: { from: string; ref: string; normalizedRef: string; candidates: string[] }[];
    unreachableNodes: string[];
    cycles: string[][];
};

export type QuestGraph = {
    nodes: QuestNode[];
    edges: QuestEdge[];
    byKey: Record<string, QuestNode>;
    requiredBy: Record<string, string[]>;
    depthByKey: Record<string, number>;
    reachableFromRoot: Set<string>;
    diagnostics: QuestDiagnostics;
};

const defaultQuestRoot = path.resolve(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'quests',
    'json'
);
const ROOT_CANONICAL_KEY = 'welcome/howtodoquests.json';
const ROOT_BASENAME = 'howtodoquests.json';

export const questComparator = (a: QuestNode, b: QuestNode): number => {
    if (a.group !== b.group) {
        return a.group.localeCompare(b.group);
    }
    if (a.title !== b.title) {
        return a.title.localeCompare(b.title);
    }
    return a.canonicalKey.localeCompare(b.canonicalKey);
};

const normalizeRef = (ref: string): string => {
    const trimmed = ref.trim();
    const withoutSlashes = trimmed.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.\//, '');
    const normalized = withoutSlashes.endsWith('.json')
        ? withoutSlashes
        : `${withoutSlashes}.json`;
    return path.posix.normalize(normalized);
};

const normalizeCanonicalKey = (questPath: string): string => path.posix.normalize(questPath);

const ensureArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.map((entry) => String(entry)) : [];

const toBasename = (canonicalKey: string): string => path.posix.basename(canonicalKey);
const toGroup = (canonicalKey: string): string => canonicalKey.split('/')[0] ?? '';

const sortKeysDeterministically = (keys: string[], byKey: Map<string, QuestNode>) =>
    keys.sort((a, b) => {
        const aNode = byKey.get(a);
        const bNode = byKey.get(b);
        if (aNode && bNode) {
            return questComparator(aNode, bNode);
        }
        return a.localeCompare(b);
    });

const edgeId = (edge: QuestEdge): string => `${edge.from}->${edge.to}`;

const buildResolverIndices = (nodes: QuestNode[], byBasename: Map<string, string[]>) => {
    const byKey = new Map<string, QuestNode>();
    nodes.forEach((node) => {
        byKey.set(node.canonicalKey, node);
        const list = byBasename.get(node.basename) ?? [];
        list.push(node.canonicalKey);
        byBasename.set(node.basename, list);
    });
    return byKey;
};

const resolveDependency = (
    from: string,
    ref: string,
    indices: {
        byKey: Map<string, QuestNode>;
        byQuestId: Map<string, string>;
        byBasename: Map<string, string[]>;
    },
    diagnostics: QuestDiagnostics
): string | undefined => {
    const normalizedRef = normalizeRef(ref);
    if (indices.byKey.has(normalizedRef)) {
        return normalizedRef;
    }

    const refWithoutExt = normalizedRef.replace(/\.json$/i, '');
    if (indices.byQuestId.has(normalizedRef)) {
        return indices.byQuestId.get(normalizedRef);
    }
    if (indices.byQuestId.has(refWithoutExt)) {
        return indices.byQuestId.get(refWithoutExt);
    }

    const basename = toBasename(normalizedRef);
    const candidates = indices.byBasename.get(basename) ?? [];
    if (candidates.length === 1) {
        return candidates[0];
    }
    if (candidates.length > 1) {
        diagnostics.ambiguousRefs.push({
            from,
            ref,
            normalizedRef,
            candidates: sortKeysDeterministically([...candidates], indices.byKey)
        });
        return undefined;
    }

    diagnostics.missingRefs.push({ from, ref, normalizedRef });
    return undefined;
};

const detectRoot = (
    byKey: Map<string, QuestNode>,
    byBasename: Map<string, string[]>,
    diagnostics: QuestDiagnostics
): string => {
    if (byKey.has(ROOT_CANONICAL_KEY)) {
        return ROOT_CANONICAL_KEY;
    }

    const candidates = byBasename.get(ROOT_BASENAME) ?? [];
    if (candidates.length === 1) {
        return candidates[0];
    }
    if (candidates.length === 0) {
        diagnostics.missingRefs.push({
            from: 'root',
            ref: ROOT_BASENAME,
            normalizedRef: ROOT_CANONICAL_KEY
        });
        throw new Error('Root quest not found: howtodoquests.json');
    }

    diagnostics.ambiguousRefs.push({
        from: 'root',
        ref: ROOT_BASENAME,
        normalizedRef: ROOT_CANONICAL_KEY,
        candidates: sortKeysDeterministically([...candidates], byKey)
    });
    throw new Error('Root quest is ambiguous: multiple howtodoquests.json files found');
};

const computeReachable = (
    root: string,
    adjacency: Map<string, string[]>,
    byKey: Map<string, QuestNode>
): Set<string> => {
    const reachable = new Set<string>();
    const stack = [root];
    while (stack.length > 0) {
        const current = stack.pop() as string;
        if (reachable.has(current)) {
            continue;
        }
        reachable.add(current);
        const neighbors = sortKeysDeterministically([...(adjacency.get(current) ?? [])], byKey);
        neighbors.forEach((neighbor) => {
            if (!reachable.has(neighbor)) {
                stack.push(neighbor);
            }
        });
    }
    return reachable;
};

const detectCycles = (
    reachable: Set<string>,
    adjacency: Map<string, string[]>,
    byKey: Map<string, QuestNode>
): string[][] => {
    const cycles: string[][] = [];
    const seen = new Set<string>();
    const visiting = new Set<string>();
    const stack: string[] = [];
    const cycleKeys = new Set<string>();

    const sortedReachable = sortKeysDeterministically([...reachable], byKey);

    const dfs = (node: string) => {
        visiting.add(node);
        stack.push(node);

        const neighbors = sortKeysDeterministically([...(adjacency.get(node) ?? [])], byKey);
        for (const neighbor of neighbors) {
            if (!reachable.has(neighbor)) {
                continue;
            }
            if (visiting.has(neighbor)) {
                const startIndex = stack.indexOf(neighbor);
                const cyclePath = [...stack.slice(startIndex), neighbor];
                const key = cyclePath.join('->');
                if (!cycleKeys.has(key)) {
                    cycleKeys.add(key);
                    cycles.push(cyclePath);
                }
                continue;
            }
            if (!seen.has(neighbor)) {
                dfs(neighbor);
            }
        }

        stack.pop();
        visiting.delete(node);
        seen.add(node);
    };

    sortedReachable.forEach((node) => {
        if (!seen.has(node)) {
            dfs(node);
        }
    });

    return cycles;
};

const chooseFeedbackEdges = (cycles: string[]): Set<string> => {
    const feedback = new Set<string>();
    cycles.forEach((cycleKey) => {
        const nodes = cycleKey.split('->');
        let selected = '';
        for (let i = 0; i < nodes.length - 1; i += 1) {
            const edge = `${nodes[i]}->${nodes[i + 1]}`;
            if (edge > selected) {
                selected = edge;
            }
        }
        if (selected) {
            feedback.add(selected);
        }
    });
    return feedback;
};

const computeDepths = (
    reachable: Set<string>,
    edges: QuestEdge[],
    cycles: string[][],
    byKey: Map<string, QuestNode>,
    root: string
): Map<string, number> => {
    const depths = new Map<string, number>();
    const filteredEdges = edges.filter(
        (edge) => reachable.has(edge.from) && reachable.has(edge.to)
    );
    const feedbackEdges = chooseFeedbackEdges(cycles.map((cycle) => cycle.join('->')));
    const adjacency = new Map<string, string[]>();
    const indegree = new Map<string, number>();

    reachable.forEach((key) => {
        adjacency.set(key, []);
        indegree.set(key, 0);
        depths.set(key, 0);
    });

    filteredEdges.forEach((edge) => {
        if (feedbackEdges.has(edgeId(edge))) {
            return;
        }
        adjacency.get(edge.from)?.push(edge.to);
        indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
    });

    adjacency.forEach((neighbors, key) => {
        adjacency.set(key, sortKeysDeterministically(neighbors, byKey));
    });

    const queue = sortKeysDeterministically(
        [...reachable].filter((key) => (indegree.get(key) ?? 0) === 0),
        byKey
    );

    const processed = new Set<string>();
    while (queue.length > 0) {
        const current = queue.shift() as string;
        processed.add(current);
        const currentDepth = depths.get(current) ?? 0;
        const neighbors = adjacency.get(current) ?? [];
        neighbors.forEach((neighbor) => {
            const candidateDepth = currentDepth + 1;
            if ((depths.get(neighbor) ?? -Infinity) < candidateDepth) {
                depths.set(neighbor, candidateDepth);
            }
            const nextIndegree = (indegree.get(neighbor) ?? 0) - 1;
            indegree.set(neighbor, nextIndegree);
            if (nextIndegree === 0) {
                queue.push(neighbor);
            }
        });
        queue.sort((a, b) => questComparator(byKey.get(a) as QuestNode, byKey.get(b) as QuestNode));
    }

    if (processed.size !== reachable.size) {
        const leftovers = sortKeysDeterministically(
            [...reachable].filter((key) => !processed.has(key)),
            byKey
        );
        leftovers.forEach((key) => {
            const neighbors = adjacency.get(key) ?? [];
            neighbors.forEach((neighbor) => {
                const candidateDepth = (depths.get(key) ?? 0) + 1;
                if ((depths.get(neighbor) ?? -Infinity) < candidateDepth) {
                    depths.set(neighbor, candidateDepth);
                }
            });
            processed.add(key);
        });
    }

    depths.set(root, depths.get(root) ?? 0);
    return depths;
};

export const buildQuestGraph = async (
    questRoot: string = defaultQuestRoot
): Promise<QuestGraph> => {
    const diagnostics: QuestDiagnostics = {
        missingRefs: [],
        ambiguousRefs: [],
        unreachableNodes: [],
        cycles: []
    };
    const questRootPosix = path.posix.resolve(questRoot);
    const runGlobSync = globModule.globSync ?? globModule.sync;
    const files = runGlobSync('**/*.json', { cwd: questRootPosix, posix: true });

    const byQuestId = new Map<string, string>();
    const byBasename = new Map<string, string[]>();
    const pendingRequires = new Map<string, string[]>();
    const nodes: QuestNode[] = [];

    files.sort();
    for (const relative of files) {
        const canonicalKey = normalizeCanonicalKey(relative);
        const fullPath = path.join(questRootPosix, relative);
        const content = await fs.readFile(fullPath, 'utf-8');
        const data = JSON.parse(content);
        const basename = toBasename(canonicalKey);
        const group = toGroup(canonicalKey);
        const title =
            typeof data.title === 'string' && data.title.trim().length > 0
                ? data.title
                : basename;
        const node: QuestNode = {
            canonicalKey,
            title,
            group,
            basename,
            requires: []
        };
        nodes.push(node);

        if (typeof data.id === 'string' && data.id.trim().length > 0) {
            byQuestId.set(data.id, canonicalKey);
        }
        pendingRequires.set(canonicalKey, ensureArray(data.requiresQuests));
    }

    const byKey = buildResolverIndices(nodes, byBasename);

    nodes.forEach((node) => {
        const resolved = pendingRequires
            .get(node.canonicalKey)
            ?.map((ref) =>
                resolveDependency(
                    node.canonicalKey,
                    ref,
                    { byKey, byQuestId, byBasename },
                    diagnostics
                )
            )
            .filter((key): key is string => Boolean(key));
        if (resolved) {
            node.requires.push(...resolved);
        }
    });

    nodes.sort(questComparator);

    const edges: QuestEdge[] = [];
    const requiredBy = new Map<string, string[]>();
    const adjacency = new Map<string, string[]>();

    byKey.forEach((node) => {
        requiredBy.set(node.canonicalKey, []);
        adjacency.set(node.canonicalKey, []);
    });

    nodes.forEach((node) => {
        const sortedRequires = sortKeysDeterministically([...node.requires], byKey);
        node.requires.splice(0, node.requires.length, ...sortedRequires);
        node.requires.forEach((dependency) => {
            edges.push({ from: dependency, to: node.canonicalKey });
            requiredBy.get(dependency)?.push(node.canonicalKey);
            adjacency.get(dependency)?.push(node.canonicalKey);
        });
    });

    edges.sort((a, b) => {
        const fromComparison = questComparator(
            byKey.get(a.from) as QuestNode,
            byKey.get(b.from) as QuestNode
        );
        if (fromComparison !== 0) {
            return fromComparison;
        }
        return questComparator(byKey.get(a.to) as QuestNode, byKey.get(b.to) as QuestNode);
    });

    requiredBy.forEach((dependents, key) => {
        requiredBy.set(key, sortKeysDeterministically(dependents, byKey));
    });

    adjacency.forEach((dependents, key) => {
        adjacency.set(key, sortKeysDeterministically(dependents, byKey));
    });

    const root = detectRoot(byKey, byBasename, diagnostics);
    const reachableFromRoot = computeReachable(root, adjacency, byKey);
    diagnostics.unreachableNodes = sortKeysDeterministically(
        nodes.map((node) => node.canonicalKey).filter((key) => !reachableFromRoot.has(key)),
        byKey
    );

    const cycles = detectCycles(reachableFromRoot, adjacency, byKey);
    diagnostics.cycles = cycles;

    const depthByKeyMap = computeDepths(reachableFromRoot, edges, cycles, byKey, root);
    const depthByKey: Record<string, number> = {};
    depthByKeyMap.forEach((value, key) => {
        depthByKey[key] = value;
    });

    const requiredByRecord: Record<string, string[]> = {};
    requiredBy.forEach((value, key) => {
        requiredByRecord[key] = value;
    });

    const byKeyRecord: Record<string, QuestNode> = {};
    byKey.forEach((node, key) => {
        byKeyRecord[key] = node;
    });

    return {
        nodes,
        edges,
        byKey: byKeyRecord,
        requiredBy: requiredByRecord,
        depthByKey,
        reachableFromRoot,
        diagnostics
    };
};
