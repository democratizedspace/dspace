const FALLBACK_NAME = 'Loading item…';
const FALLBACK_DESCRIPTION = 'Custom item';

export function getItemMetadata(entry, itemMap) {
    const key =
        typeof entry?.id === 'string' || typeof entry?.id === 'number' ? String(entry.id) : '';
    const knownItem = itemMap?.get(key);

    if (knownItem) {
        return knownItem;
    }

    return {
        id: entry?.id ?? key,
        name: entry?.name || FALLBACK_NAME,
        image: entry?.image || null,
        description: entry?.description || FALLBACK_DESCRIPTION,
        loading: true,
        missing: false,
        releaseImage: null,
    };
}

export function buildFullItemList(itemList, totals = {}, itemMap = new Map()) {
    return itemList.map((item) => {
        const metadata = getItemMetadata(item, itemMap);
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
