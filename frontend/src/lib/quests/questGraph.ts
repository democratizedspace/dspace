import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

export interface MissingRef {
    from: string;
    ref: string;
}

export interface AmbiguousRef {
    from: string;
    ref: string;
    matches: string[];
}

export interface QuestDiagnostics {
    missingRefs: MissingRef[];
    ambiguousRefs: AmbiguousRef[];
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

const resolveDefaultQuestDir = (): string => {
    if (typeof import.meta.url === 'string' && import.meta.url.startsWith('file:')) {
        const moduleDir = path.dirname(fileURLToPath(import.meta.url));
        return path.resolve(moduleDir, '../../pages/quests/json');
    }

    return path.resolve(process.cwd(), 'frontend/src/pages/quests/json');
};

const DEFAULT_QUESTS_DIR = resolveDefaultQuestDir();

const normalizeRef = (ref: string): string => {
    const cleaned = ref.trim().replace(/\\/g, '/').replace(/^\.\/?/, '');
    return cleaned.endsWith('.json') ? cleaned : `${cleaned}.json`;
};

const canonicalizePath = (filePath: string, baseDir: string): string => {
    const relative = path.relative(baseDir, filePath);
    return relative.split(path.sep).join('/');
};

const collectQuestFiles = (dir: string): string[] => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];

    entries.forEach((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectQuestFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            files.push(fullPath);
        }
    });

    return files;
};

const compareByKey = (
    aKey: string,
    bKey: string,
    byKey: Record<string, QuestNode>
): number => {
    const aNode = byKey[aKey];
    const bNode = byKey[bKey];

    if (aNode && bNode) {
        return questSortComparator(aNode, bNode);
    }

    return aKey.localeCompare(bKey);
};

export const questSortComparator = (a: QuestNode, b: QuestNode): number => {
    if (a.group !== b.group) {
        return a.group.localeCompare(b.group);
    }

    if (a.title !== b.title) {
        return a.title.localeCompare(b.title);
    }

    return a.canonicalKey.localeCompare(b.canonicalKey);
};

interface QuestDefinition {
    id?: string;
    title?: string;
    requiresQuests?: string[];
}

export const buildQuestGraph = (questsDir: string = DEFAULT_QUESTS_DIR): QuestGraph => {
    const resolvedQuestDir = path.resolve(questsDir);
    const questFiles = collectQuestFiles(resolvedQuestDir).sort();

    const nodes: QuestNode[] = [];
    const byKey: Record<string, QuestNode> = {};
    const rawRequires = new Map<string, string[]>();
    const byBasename = new Map<string, string[]>();
    const byQuestId = new Map<string, string>();
    const requiredBy: Record<string, string[]> = {};

    questFiles.forEach((filePath) => {
        const questData = JSON.parse(fs.readFileSync(filePath, 'utf8')) as QuestDefinition;
        const canonicalKey = canonicalizePath(filePath, resolvedQuestDir);
        const basename = path.basename(filePath);
        const [group] = canonicalKey.split('/');
        const title = questData.title?.trim() || basename;
        const requires = Array.isArray(questData.requiresQuests)
            ? questData.requiresQuests.filter((entry): entry is string => typeof entry === 'string')
            : [];

        const node: QuestNode = {
            canonicalKey,
            title,
            group,
            basename,
            requires: []
        };

        nodes.push(node);
        byKey[canonicalKey] = node;
        rawRequires.set(canonicalKey, requires);
        requiredBy[canonicalKey] = [];

        const basenameEntries = byBasename.get(basename) || [];
        basenameEntries.push(canonicalKey);
        byBasename.set(basename, basenameEntries);

        if (questData.id) {
            byQuestId.set(questData.id, canonicalKey);
        }
    });

    const diagnostics: QuestDiagnostics = {
        missingRefs: [],
        ambiguousRefs: [],
        unreachableNodes: [],
        cycles: []
    };

    const edges: QuestEdge[] = [];

    const sortedKeys = Object.keys(byKey).sort((a, b) => compareByKey(a, b, byKey));

    sortedKeys.forEach((canonicalKey) => {
        const requires = rawRequires.get(canonicalKey) || [];
        const resolvedRequires = new Set<string>();

        requires.forEach((ref) => {
            const normalized = normalizeRef(ref);
            const normalizedWithoutExt = normalized.replace(/\.json$/u, '');

            if (byKey[normalized]) {
                resolvedRequires.add(normalized);
                return;
            }

            const questIdMatch =
                byQuestId.get(ref) ||
                byQuestId.get(normalized) ||
                byQuestId.get(normalizedWithoutExt);

            if (questIdMatch) {
                resolvedRequires.add(questIdMatch);
                return;
            }

            const basename = path.posix.basename(normalized);
            const basenameMatches = byBasename.get(basename);

            if (basenameMatches && basenameMatches.length === 1) {
                resolvedRequires.add(basenameMatches[0]);
                return;
            }

            if (basenameMatches && basenameMatches.length > 1) {
                diagnostics.ambiguousRefs.push({
                    from: canonicalKey,
                    ref,
                    matches: [...basenameMatches].sort((a, b) => compareByKey(a, b, byKey))
                });
                return;
            }

            diagnostics.missingRefs.push({
                from: canonicalKey,
                ref
            });
        });

        const sortedRequires = [...resolvedRequires].sort((a, b) => compareByKey(a, b, byKey));
        byKey[canonicalKey].requires = sortedRequires;

        sortedRequires.forEach((fromKey) => {
            edges.push({ from: fromKey, to: canonicalKey });
            requiredBy[fromKey].push(canonicalKey);
        });
    });

    Object.values(requiredBy).forEach((children) =>
        children.sort((a, b) => compareByKey(a, b, byKey))
    );

    edges.sort((a, b) => {
        const fromCompare = compareByKey(a.from, b.from, byKey);
        if (fromCompare !== 0) {
            return fromCompare;
        }

        return compareByKey(a.to, b.to, byKey);
    });

    const rootCandidate = byKey['welcome/howtodoquests.json']
        ? 'welcome/howtodoquests.json'
        : (byBasename.get('howtodoquests.json') || [])[0];

    if (!rootCandidate) {
        diagnostics.missingRefs.push({ from: '__root__', ref: 'howtodoquests.json' });
        throw new Error('Root quest could not be determined');
    }

    const alternateRoots = byBasename.get('howtodoquests.json') || [];
    if (rootCandidate && alternateRoots.length > 1) {
        diagnostics.ambiguousRefs.push({
            from: '__root__',
            ref: 'howtodoquests.json',
            matches: [...alternateRoots].sort((a, b) => compareByKey(a, b, byKey))
        });
        throw new Error('Root quest could not be determined');
    }

    const reachableFromRoot = new Set<string>();
    const visitReachable = (key: string) => {
        if (reachableFromRoot.has(key)) {
            return;
        }

        reachableFromRoot.add(key);
        (requiredBy[key] || []).forEach((child) => visitReachable(child));
    };

    visitReachable(rootCandidate);

    nodes.forEach((node) => {
        if (!reachableFromRoot.has(node.canonicalKey)) {
            diagnostics.unreachableNodes.push(node.canonicalKey);
        }
    });

    diagnostics.unreachableNodes.sort((a, b) => compareByKey(a, b, byKey));

    const cycles: string[][] = [];
    const inStack = new Set<string>();
    const visited = new Set<string>();
    const pathStack: string[] = [];
    const cycleKeys = new Set<string>();

    const normalizeCyclePath = (cyclePath: string[]): string[] => {
        const inner = cyclePath.slice(0, -1);
        const minIndex = inner.reduce((bestIndex, key, index) => {
            const bestKey = inner[bestIndex];
            return compareByKey(key, bestKey, byKey) < 0 ? index : bestIndex;
        }, 0);

        const rotated = [...inner.slice(minIndex), ...inner.slice(0, minIndex)];
        rotated.push(rotated[0]);
        return rotated;
    };

    const addCycle = (cyclePath: string[]) => {
        const normalized = normalizeCyclePath(cyclePath);
        const key = normalized.join('->');

        if (cycleKeys.has(key)) {
            return;
        }

        cycleKeys.add(key);
        cycles.push(normalized);
    };

    const cycleDfs = (key: string) => {
        visited.add(key);
        inStack.add(key);
        pathStack.push(key);

        const children = (requiredBy[key] || []).slice().sort((a, b) => compareByKey(a, b, byKey));
        children.forEach((child) => {
            if (!reachableFromRoot.has(child)) {
                return;
            }

            if (!visited.has(child)) {
                cycleDfs(child);
                return;
            }

            if (inStack.has(child)) {
                const cycleStartIndex = pathStack.indexOf(child);
                if (cycleStartIndex !== -1) {
                    addCycle([...pathStack.slice(cycleStartIndex), child]);
                }
            }
        });

        pathStack.pop();
        inStack.delete(key);
    };

    [...reachableFromRoot]
        .sort((a, b) => compareByKey(a, b, byKey))
        .forEach((key) => {
            if (!visited.has(key)) {
                cycleDfs(key);
            }
        });

    diagnostics.cycles = cycles;

    const feedbackEdges = new Set<string>();
    cycles.forEach((cyclePath) => {
        const edgesInCycle: string[] = [];
        for (let i = 0; i < cyclePath.length - 1; i += 1) {
            edgesInCycle.push(`${cyclePath[i]}->${cyclePath[i + 1]}`);
        }

        const sortedCycleEdges = edgesInCycle.sort();
        const feedbackEdge = sortedCycleEdges[sortedCycleEdges.length - 1];
        feedbackEdges.add(feedbackEdge);
    });

    const depthByKey: Record<string, number> = {};
    const indegree: Record<string, number> = {};

    nodes.forEach((node) => {
        depthByKey[node.canonicalKey] = 0;
        indegree[node.canonicalKey] = 0;
    });

    edges.forEach((edge) => {
        const edgeKey = `${edge.from}->${edge.to}`;
        if (feedbackEdges.has(edgeKey)) {
            return;
        }

        indegree[edge.to] += 1;
    });

    const processingQueue = sortedKeys.filter((key) => indegree[key] === 0);

    while (processingQueue.length > 0) {
        const currentKey = processingQueue.shift();
        if (!currentKey) {
            continue;
        }

        const currentDepth = depthByKey[currentKey];
        (requiredBy[currentKey] || []).forEach((child) => {
            const edgeKey = `${currentKey}->${child}`;
            if (feedbackEdges.has(edgeKey)) {
                return;
            }

            depthByKey[child] = Math.max(depthByKey[child], currentDepth + 1);
            indegree[child] -= 1;
            if (indegree[child] === 0) {
                processingQueue.push(child);
            }
        });
    }

    nodes.sort(questSortComparator);

    diagnostics.missingRefs.sort((a, b) => {
        const fromCompare = compareByKey(a.from, b.from, byKey);
        if (fromCompare !== 0) {
            return fromCompare;
        }

        return a.ref.localeCompare(b.ref);
    });

    diagnostics.ambiguousRefs.sort((a, b) => {
        const fromCompare = compareByKey(a.from, b.from, byKey);
        if (fromCompare !== 0) {
            return fromCompare;
        }

        return a.ref.localeCompare(b.ref);
    });

    return {
        nodes,
        edges,
        byKey,
        requiredBy,
        depthByKey,
        reachableFromRoot,
        diagnostics
    };
};
