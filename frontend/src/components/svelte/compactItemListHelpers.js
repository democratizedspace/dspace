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
    return itemList.map((item) => {
        const metadata = getItemMetadata(item);
        const hasCount = Object.prototype.hasOwnProperty.call(item, 'count');
        const rawCount =
            hasCount && item.count !== undefined && item.count !== null ? Number(item.count) : null;

        return {
            ...metadata,
            count:
                rawCount !== null && Number.isFinite(rawCount) ? Number(rawCount.toFixed(5)) : null,
            total: totals[item.id] ?? 0,
        };
    });
}
