export function getItemMetadata(entry, metadataMap) {
    const id = entry?.id;
    const normalizedId = typeof id === 'string' || typeof id === 'number' ? String(id) : null;
    const knownItem = normalizedId ? metadataMap?.get(normalizedId) : null;

    if (knownItem) {
        return knownItem;
    }

    return {
        id: entry.id,
        name: entry.name || 'Loading item…',
        image: entry.image || null,
        description: entry.description || '',
        isLoading: true,
    };
}

export function buildFullItemList(itemList, totals = {}, metadataMap = new Map()) {
    return itemList.map((item) => {
        const metadata = getItemMetadata(item, metadataMap);
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
