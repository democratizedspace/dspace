import type { QuestGraph, QuestNode } from './questGraph';

const ROOT_CANONICAL_KEY = 'welcome/howtodoquests.json';
const ROOT_BASENAME = 'howtodoquests.json';

export const compareQuestNodes = (a: QuestNode | undefined, b: QuestNode | undefined): number => {
    if (!a || !b) {
        return a ? -1 : b ? 1 : 0;
    }

    const order: Array<keyof QuestNode> = ['group', 'title', 'canonicalKey'];
    for (const key of order) {
        if (a[key] < b[key]) return -1;
        if (a[key] > b[key]) return 1;
    }

    return 0;
};

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
    const comparison = compareQuestNodes(lookup(a), lookup(b));
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

export const resolveQuestGraphRoot = (graph: Pick<QuestGraph, 'byKey' | 'nodes'> | undefined) => {
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
