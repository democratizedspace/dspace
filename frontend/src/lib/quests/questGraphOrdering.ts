export type QuestNodeLike = {
    canonicalKey: string;
    title: string;
    group: string;
};

export type QuestNodeLookup<T extends QuestNodeLike> =
    | Record<string, T | undefined>
    | Map<string, T | undefined>;

export const comparatorKeys: Array<keyof QuestNodeLike> = ['group', 'title', 'canonicalKey'];

export const compareQuestNodes = <T extends QuestNodeLike | undefined>(
    a?: T,
    b?: T
): number => {
    if (!a || !b) {
        return a ? -1 : b ? 1 : 0;
    }

    for (const key of comparatorKeys) {
        if (a[key] < b[key]) return -1;
        if (a[key] > b[key]) return 1;
    }

    return 0;
};

const lookupNode = <T extends QuestNodeLike>(
    lookup: QuestNodeLookup<T>,
    key?: string
): T | undefined => {
    if (!key) return undefined;
    return lookup instanceof Map ? lookup.get(key) : lookup[key];
};

export const compareQuestNodeKeys = <T extends QuestNodeLike>(
    lookup: QuestNodeLookup<T>,
    a?: string,
    b?: string
): number => {
    return compareQuestNodes(lookupNode(lookup, a), lookupNode(lookup, b));
};

export const sortQuestNodeKeys = <T extends QuestNodeLike>(
    lookup: QuestNodeLookup<T>,
    keys: string[] = []
): string[] => {
    return [...keys].sort((left, right) => compareQuestNodeKeys(lookup, left, right));
};

export const sortQuestNodes = <T extends QuestNodeLike>(nodes: T[] = []): T[] => {
    return [...nodes].sort(compareQuestNodes);
};
