import { promises as fs } from 'node:fs';
import path from 'node:path';
import glob from 'glob';

const QUESTS_DIR = path.join(process.cwd(), 'frontend/src/pages/quests/json');
const DEFAULT_ROOT_KEY = 'welcome/howtodoquests.json';

export interface QuestNode {
    canonicalKey: string;
    title: string;
    group: string;
    basename: string;
    requires: string[];
}

export interface QuestEdge {
    from: string;
    to: string;
}

export interface QuestDiagnostics {
    missingRefs: Array<{ from: string; ref: string }>;
    ambiguousRefs: Array<{ from: string; ref: string; matches: string[] }>;
    unreachableNodes: string[];
    cycles: string[][];
}

export interface QuestGraph {
    nodes: QuestNode[];
    edges: QuestEdge[];
    byKey: Record<string, QuestNode>;
    requiredBy: Record<string, string[]>;
    depthByKey: Record<string, number>;
    reachableFromRoot: Set<string>;
    diagnostics: QuestDiagnostics;
}

type RawQuest = QuestNode & {
    requiresRefs: string[];
    id?: string;
};

const stableNodeCompare = (a: QuestNode, b: QuestNode) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    if (a.title !== b.title) return a.title.localeCompare(b.title);
    return a.canonicalKey.localeCompare(b.canonicalKey);
};

function normalizeRef(ref: string) {
    const trimmed = ref.trim().replace(/\\/g, '/');
    if (trimmed.startsWith('/')) {
        return trimmed.slice(1);
    }
    return path.posix.normalize(trimmed);
}

const ensureJsonSuffix = (value: string) =>
    value.endsWith('.json') ? value : `${value}.json`;

const stripJsonSuffix = (value: string) =>
    value.endsWith('.json') ? value.slice(0, -5) : value;

function resolveDependency(
    ref: string,
    quest: RawQuest,
    indexes: {
        byCanonical: Map<string, RawQuest>;
        byQuestId: Map<string, string>;
        byBasename: Map<string, string[]>;
    },
    diagnostics: QuestDiagnostics
) {
    const normalizedRef = normalizeRef(ref);
    const canonicalCandidate = indexes.byCanonical.has(normalizedRef)
        ? normalizedRef
        : indexes.byCanonical.has(ensureJsonSuffix(normalizedRef))
          ? ensureJsonSuffix(normalizedRef)
          : undefined;

    if (canonicalCandidate) {
        return canonicalCandidate;
    }

    const questIdCandidate =
        indexes.byQuestId.get(stripJsonSuffix(normalizedRef)) ??
        indexes.byQuestId.get(ensureJsonSuffix(normalizedRef));
    if (questIdCandidate) {
        return questIdCandidate;
    }

    const basename = path.posix.basename(ensureJsonSuffix(normalizedRef));
    const basenameMatches = indexes.byBasename.get(basename) ?? [];
    if (basenameMatches.length === 1) {
        return basenameMatches[0];
    }

    if (basenameMatches.length > 1) {
        diagnostics.ambiguousRefs.push({
            from: quest.canonicalKey,
            ref,
            matches: [...basenameMatches].sort(),
        });
        return undefined;
    }

    diagnostics.missingRefs.push({ from: quest.canonicalKey, ref });
    return undefined;
}

function buildRequiredBy(edges: QuestEdge[], byKey: Record<string, QuestNode>) {
    const adjacency: Record<string, string[]> = {};

    for (const edge of edges) {
        adjacency[edge.from] = adjacency[edge.from] ?? [];
        adjacency[edge.from].push(edge.to);
    }

    for (const [key, children] of Object.entries(adjacency)) {
        const unique = [...new Set(children)];
        unique.sort((a, b) => stableNodeCompare(byKey[a], byKey[b]));
        adjacency[key] = unique;
    }

    for (const key of Object.keys(byKey)) {
        adjacency[key] = adjacency[key] ?? [];
    }

    return adjacency;
}

function findRoot(
    byKey: Record<string, QuestNode>,
    byBasename: Map<string, string[]>,
    diagnostics: QuestDiagnostics
) {
    if (byKey[DEFAULT_ROOT_KEY]) {
        return DEFAULT_ROOT_KEY;
    }

    const candidates = byBasename.get('howtodoquests.json') ?? [];
    if (candidates.length === 1) {
        return candidates[0];
    }

    if (candidates.length > 1) {
        diagnostics.ambiguousRefs.push({
            from: '<root>',
            ref: 'howtodoquests.json',
            matches: [...candidates].sort(),
        });
    } else {
        diagnostics.missingRefs.push({ from: '<root>', ref: 'howtodoquests.json' });
    }

    throw new Error('Root quest could not be determined');
}

function collectReachable(rootKey: string, requiredBy: Record<string, string[]>) {
    const reachable = new Set<string>();
    const queue = [rootKey];

    while (queue.length) {
        const current = queue.shift();
        if (!current || reachable.has(current)) continue;
        reachable.add(current);

        for (const child of requiredBy[current] ?? []) {
            if (!reachable.has(child)) {
                queue.push(child);
            }
        }
    }

    return reachable;
}

function detectCycles(
    rootKey: string,
    requiredBy: Record<string, string[]>,
    reachable: Set<string>,
    byKey: Record<string, QuestNode>
) {
    const cycles: string[][] = [];
    const seen = new Set<string>();
    const visiting = new Set<string>();
    const stack: string[] = [];
    const signatures = new Set<string>();

    const dfs = (node: string) => {
        if (seen.has(node)) return;

        visiting.add(node);
        stack.push(node);

        for (const child of (requiredBy[node] ?? []).slice().sort((a, b) => {
            return stableNodeCompare(byKey[a], byKey[b]);
        })) {
            if (!reachable.has(child)) continue;

            if (visiting.has(child)) {
                const startIndex = stack.indexOf(child);
                const cyclePath = [...stack.slice(startIndex), child];
                const signature = cyclePath.join('->');
                if (!signatures.has(signature)) {
                    signatures.add(signature);
                    cycles.push(cyclePath);
                }
                continue;
            }

            dfs(child);
        }

        stack.pop();
        visiting.delete(node);
        seen.add(node);
    };

    dfs(rootKey);
    return cycles;
}

function chooseFeedbackEdges(cycles: string[][]) {
    const feedback = new Set<string>();
    for (const cycle of cycles) {
        if (cycle.length < 2) continue;
        const edges = [];
        for (let i = 0; i < cycle.length - 1; i += 1) {
            edges.push(`${cycle[i]}->${cycle[i + 1]}`);
        }
        edges.sort();
        const edge = edges.at(-1);
        if (edge) {
            feedback.add(edge);
        }
    }
    return feedback;
}

function computeDepths(
    rootKey: string,
    reachable: Set<string>,
    edges: QuestEdge[],
    feedbackEdges: Set<string>,
    byKey: Record<string, QuestNode>
) {
    const depthByKey: Record<string, number> = {};
    const indegree = new Map<string, number>();
    const outgoing = new Map<string, string[]>();

    for (const key of reachable) {
        indegree.set(key, 0);
    }

    for (const edge of edges) {
        if (!reachable.has(edge.from) || !reachable.has(edge.to)) continue;
        const edgeKey = `${edge.from}->${edge.to}`;
        if (feedbackEdges.has(edgeKey)) continue;

        outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge.to]);
        indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
    }

    const queue = [...reachable].filter((key) => (indegree.get(key) ?? 0) === 0);
    queue.sort((a, b) => stableNodeCompare(byKey[a], byKey[b]));
    depthByKey[rootKey] = 0;

    while (queue.length) {
        const current = queue.shift() as string;
        const currentDepth = depthByKey[current] ?? 0;

        const children = [...(outgoing.get(current) ?? [])].sort((a, b) =>
            stableNodeCompare(byKey[a], byKey[b])
        );

        for (const child of children) {
            const proposed = currentDepth + 1;
            if (depthByKey[child] === undefined || proposed > depthByKey[child]) {
                depthByKey[child] = proposed;
            }

            const updatedIndegree = (indegree.get(child) ?? 0) - 1;
            indegree.set(child, updatedIndegree);
            if (updatedIndegree === 0) {
                queue.push(child);
                queue.sort((a, b) => stableNodeCompare(byKey[a], byKey[b]));
            }
        }
    }

    for (const key of reachable) {
        depthByKey[key] = depthByKey[key] ?? 0;
    }

    return depthByKey;
}

async function loadRawQuests(baseDir: string) {
    const files = glob.sync('**/*.json', { cwd: baseDir, absolute: true });
    files.sort();

    const quests: RawQuest[] = [];

    for (const file of files) {
        const raw = await fs.readFile(file, 'utf8');
        const parsed = JSON.parse(raw) as {
            id?: string;
            title?: string;
            requiresQuests?: string[];
        };
        const canonicalKey = path
            .relative(baseDir, file)
            .replace(/\\/g, '/')
            .replace(/^\/*/, '');
        const basename = path.basename(file);
        const [group] = canonicalKey.split('/');

        quests.push({
            canonicalKey,
            basename,
            group,
            title: parsed.title ?? basename,
            requires: [],
            requiresRefs: parsed.requiresQuests ?? [],
            id: parsed.id,
        });
    }

    quests.sort(stableNodeCompare);
    return quests;
}

export async function buildQuestGraph(baseDir = QUESTS_DIR): Promise<QuestGraph> {
    const diagnostics: QuestDiagnostics = {
        ambiguousRefs: [],
        missingRefs: [],
        unreachableNodes: [],
        cycles: [],
    };

    const quests = await loadRawQuests(baseDir);
    const byCanonical = new Map<string, RawQuest>();
    const byQuestId = new Map<string, string>();
    const byBasename = new Map<string, string[]>();

    for (const quest of quests) {
        byCanonical.set(quest.canonicalKey, quest);
        if (quest.id) {
            byQuestId.set(quest.id, quest.canonicalKey);
        }
        const basenameList = byBasename.get(quest.basename) ?? [];
        basenameList.push(quest.canonicalKey);
        byBasename.set(quest.basename, basenameList);
    }

    const resolvedNodes: QuestNode[] = quests.map((quest) => {
        const resolved = new Set<string>();

        for (const ref of quest.requiresRefs) {
            const match = resolveDependency(
                ref,
                quest,
                { byCanonical, byQuestId, byBasename },
                diagnostics
            );
            if (match) {
                resolved.add(match);
            }
        }

        return {
            canonicalKey: quest.canonicalKey,
            title: quest.title,
            group: quest.group,
            basename: quest.basename,
            requires: [...resolved].sort((a, b) =>
                stableNodeCompare(byCanonical.get(a) ?? quest, byCanonical.get(b) ?? quest)
            ),
        };
    });

    resolvedNodes.sort(stableNodeCompare);
    const byKey = resolvedNodes.reduce<Record<string, QuestNode>>((acc, quest) => {
        acc[quest.canonicalKey] = quest;
        return acc;
    }, {});

    const edges: QuestEdge[] = [];
    for (const quest of resolvedNodes) {
        for (const requirement of quest.requires) {
            edges.push({ from: requirement, to: quest.canonicalKey });
        }
    }

    edges.sort((a, b) => {
        const fromCompare = stableNodeCompare(byKey[a.from], byKey[b.from]);
        if (fromCompare !== 0) return fromCompare;
        return stableNodeCompare(byKey[a.to], byKey[b.to]);
    });

    const requiredBy = buildRequiredBy(edges, byKey);
    const rootKey = findRoot(byKey, byBasename, diagnostics);
    const reachableFromRoot = collectReachable(rootKey, requiredBy);

    diagnostics.unreachableNodes = resolvedNodes
        .filter((node) => !reachableFromRoot.has(node.canonicalKey))
        .sort(stableNodeCompare)
        .map((node) => node.canonicalKey);

    diagnostics.cycles = detectCycles(rootKey, requiredBy, reachableFromRoot, byKey);
    const feedbackEdges = chooseFeedbackEdges(diagnostics.cycles);
    const depthByKey = computeDepths(rootKey, reachableFromRoot, edges, feedbackEdges, byKey);

    return {
        nodes: resolvedNodes,
        edges,
        byKey,
        requiredBy,
        depthByKey,
        reachableFromRoot,
        diagnostics,
    };
}
