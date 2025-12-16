import items from '../../pages/inventory/json/items';

export function getItemMetadata(entry) {
    const knownItem = items.find((candidate) => candidate.id === entry.id);
    if (knownItem) {
        return knownItem;
    }

    return {
        id: entry.id,
        name: entry.name || entry.id,
        image: entry.image || '/favicon.ico',
        description: entry.description || 'Custom item',
    };
}

export function buildFullItemList(itemList, totals = {}) {
    const mergedItems = new Map();

    itemList.forEach((item) => {
        if (!item?.id) {
            return;
        }

        const metadata = getItemMetadata(item);
        const hasCount = Object.prototype.hasOwnProperty.call(item, 'count');
        const rawCount =
            hasCount && item.count !== undefined && item.count !== null ? Number(item.count) : null;
        const normalizedCount =
            rawCount !== null && Number.isFinite(rawCount) ? Number(rawCount.toFixed(5)) : null;

        const existing = mergedItems.get(item.id) ?? { ...metadata, count: null };
        const mergedCount =
            normalizedCount === null
                ? existing.count
                : existing.count === null
                  ? normalizedCount
                  : Number((existing.count + normalizedCount).toFixed(5));

        mergedItems.set(item.id, {
            ...existing,
            count: mergedCount,
            total: totals[item.id] ?? existing.total ?? 0,
        });
    });

    return Array.from(mergedItems.values());
}
