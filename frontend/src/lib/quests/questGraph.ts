import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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

export type QuestData = {
    path: string; // Relative path like './json/welcome/howtodoquests.json'
    quest: {
        id?: string;
        title?: string;
        requiresQuests?: string[];
    };
};

export type BuildQuestGraphOptions = {
    quests?: QuestData[]; // Pre-loaded quest data
    questDir?: string; // For backwards compatibility with tests
};

const ROOT_CANONICAL_KEY = 'welcome/howtodoquests.json';
const ROOT_BASENAME = 'howtodoquests.json';
const QUEST_JSON_PATH_PREFIX = './json/';
const QUEST_PATH_REGEX = new RegExp(`^${QUEST_JSON_PATH_PREFIX.replace('.', '\\.')}(.+)$`);

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

export const compareQuestNodes = (a: QuestNode | undefined, b: QuestNode | undefined): number =>
    compareNodes(a, b);

export const compareQuestKeys = (
    a: string,
    b: string,
    graph:
        | {
              byKey?: Record<string, QuestNode | undefined>;
          }
        | Map<string, QuestNode>
): number => {
    const lookup =
        graph instanceof Map
            ? (key: string) => graph.get(key)
            : (key: string) => graph.byKey?.[key];
    const comparison = compareNodes(lookup(a), lookup(b));
    return comparison === 0 ? a.localeCompare(b) : comparison;
};

export const sortQuestKeys = (
    keys: string[] | Set<string>,
    graph:
        | {
              byKey?: Record<string, QuestNode | undefined>;
          }
        | Map<string, QuestNode>
): string[] => [...keys].sort((left, right) => compareQuestKeys(left, right, graph));

const compareKeys = (a: string, b: string, nodeIndex: Map<string, QuestNode>): number => {
    return compareQuestKeys(a, b, nodeIndex);
};

const normalizeRef = (ref: string): string =>
    path.posix.normalize(ref.trim().replace(/\\/g, '/').replace(/^\/+/, ''));

// Convert import.meta.glob path to canonical key
// './json/welcome/howtodoquests.json' -> 'welcome/howtodoquests.json'
const toCanonicalKey = (globPath: string): string => {
    const normalized = globPath.replace(/\\/g, '/');
    const match = normalized.match(QUEST_PATH_REGEX);
    return match ? path.posix.normalize(match[1]) : path.posix.normalize(normalized);
};

const makeRecord = <T>(map: Map<string, T>): Record<string, T> => {
    const record: Record<string, T> = {};
    for (const [key, value] of map) {
        record[key] = value;
    }
    return record;
};

export const resolveQuestGraphRoot = (graph: QuestGraph | undefined): string => {
    if (!graph) return '';
    if (graph.byKey?.[ROOT_CANONICAL_KEY]) return ROOT_CANONICAL_KEY;

    const sortedNodes = [...(graph.nodes ?? [])].sort(compareQuestNodes);
    const howToMatches = sortedNodes.filter(
        (node) => node.canonicalKey.split('/').pop() === ROOT_BASENAME
    );
    if (howToMatches.length === 1) {
        return howToMatches[0].canonicalKey;
    }

    return sortedNodes[0]?.canonicalKey ?? '';
};

// Default quest directory (for tests that don't pass a questDir)
const getDefaultQuestDir = (): string => {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../pages/quests/json');
};

// Helper function to load quest data from filesystem (for tests and Node.js environments)
export const loadQuestsFromDir = (questDir: string): QuestData[] => {
    // Recursively find all .json files in questDir
    const findQuestFiles = (dir: string): string[] => {
        const results: string[] = [];
        const items = fs.readdirSync(dir, { withFileTypes: true });

        // Sort by name for deterministic traversal across filesystems
        items.sort((a, b) => a.name.localeCompare(b.name));

        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                results.push(...findQuestFiles(fullPath));
            } else if (item.isFile() && item.name.endsWith('.json')) {
                results.push(fullPath);
            }
        }

        return results;
    };

    const questFiles = findQuestFiles(questDir).sort();
    const questData: QuestData[] = [];

    for (const file of questFiles) {
        const raw = fs.readFileSync(file, 'utf8');
        let questRaw: unknown;
        try {
            questRaw = JSON.parse(raw);
        } catch (err: unknown) {
            const message =
                err instanceof Error && typeof err.message === 'string' ? err.message : String(err);
            throw new Error(`Failed to parse quest JSON in file "${file}": ${message}`);
        }
        if (!questRaw || typeof questRaw !== 'object' || Array.isArray(questRaw)) {
            throw new Error(`Quest JSON in file "${file}" must be an object`);
        }

        // Convert absolute path to relative path format like './json/welcome/howtodoquests.json'
        const relativePath = path.relative(questDir, file).replace(/\\/g, '/');
        const globPath = `${QUEST_JSON_PATH_PREFIX}${relativePath}`;

        questData.push({
            path: globPath,
            quest: questRaw as { id?: string; title?: string; requiresQuests?: string[] },
        });
    }

    return questData;
};

export const buildQuestGraph = (options: BuildQuestGraphOptions = {}): QuestGraph => {
    // Support both new (quests) and old (questDir) API
    // Validate that both options are not provided simultaneously
    if (options.quests && options.questDir) {
        throw new Error('Cannot provide both "quests" and "questDir" options to buildQuestGraph');
    }

    let quests: QuestData[];
    if (options.quests) {
        quests = options.quests;
    } else if (options.questDir) {
        quests = loadQuestsFromDir(options.questDir);
    } else {
        // Default: load from default quest directory
        quests = loadQuestsFromDir(getDefaultQuestDir());
    }

    const diagnostics: QuestDiagnostics = {
        missingRefs: [],
        ambiguousRefs: [],
        unreachableNodes: [],
        cycles: [],
    };

    const nodes: QuestNode[] = [];
    const nodeIndex = new Map<string, QuestNode>();
    const rawRequiresIndex = new Map<string, string[]>();
    const byBasename = new Map<string, string[]>();
    const byQuestId = new Map<string, string>();

    // Sort quest data by path for deterministic processing (copy to avoid mutating input)
    const sortedQuests = [...quests].sort((a, b) => a.path.localeCompare(b.path));

    for (const { path: globPath, quest } of sortedQuests) {
        const canonicalKey = toCanonicalKey(globPath);
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

        const requiresQuests = Array.isArray(quest.requiresQuests)
            ? quest.requiresQuests.filter((value): value is string => typeof value === 'string')
            : [];
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

            const adjacentNodes = adjacency.get(requireKey) ?? [];
            adjacentNodes.push(node.canonicalKey);
            adjacency.set(requireKey, adjacentNodes);
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
            return undefined;
        }

        diagnostics.ambiguousRefs.push({
            from: '<root>',
            ref: ROOT_BASENAME,
            candidates: [...candidates],
        });
        return undefined;
    })();

    const reachableFromRoot = new Set<string>();
    const queue: string[] = rootKey ? [rootKey] : [];
    let queueIndex = 0;

    while (queueIndex < queue.length) {
        const current = queue[queueIndex++];
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
        if (visited.has(key)) return;

        visiting.add(key);
        stack.push(key);
        const neighbors = adjacency.get(key) ?? [];

        for (const neighbor of neighbors) {
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
    const allKeysInOrder = nodes.map((node) => node.canonicalKey);
    const traversalOrder = rootKey
        ? [rootKey, ...allKeysInOrder.filter((key) => key !== rootKey)]
        : allKeysInOrder;
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
        const adjacentNodes = filteredAdjacency.get(edge.from) ?? [];
        adjacentNodes.push(edge.to);
        filteredAdjacency.set(edge.from, adjacentNodes);
    }

    for (const [, list] of filteredAdjacency) {
        list.sort((a, b) => compareKeys(a, b, nodeIndex));
    }

    const depthByKey = new Map<string, number>();
    const topoQueue = nodes
        .filter((node) => (indegree.get(node.canonicalKey) ?? 0) === 0)
        .map((node) => node.canonicalKey);

    topoQueue.sort((a, b) => compareKeys(a, b, nodeIndex));

    const insertSorted = (list: string[], value: string, startIndex: number) => {
        let low = startIndex;
        let high = list.length;

        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (compareKeys(value, list[mid], nodeIndex) < 0) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }

        list.splice(low, 0, value);
    };

    let topoQueueIndex = 0;
    while (topoQueueIndex < topoQueue.length) {
        const current = topoQueue[topoQueueIndex++];
        const currentDepth = depthByKey.get(current) ?? 0;
        const neighbors = filteredAdjacency.get(current) ?? [];

        for (const neighbor of neighbors) {
            const nextDepth = Math.max(currentDepth + 1, depthByKey.get(neighbor) ?? 0);
            depthByKey.set(neighbor, nextDepth);

            const nextIndegree = (indegree.get(neighbor) ?? 0) - 1;
            indegree.set(neighbor, nextIndegree);
            if (nextIndegree === 0) {
                insertSorted(topoQueue, neighbor, topoQueueIndex);
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
