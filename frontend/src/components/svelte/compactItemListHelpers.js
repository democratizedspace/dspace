import { getCachedItemById } from '../../utils/itemResolver.js';

const normalizeId = (id) => (typeof id === 'string' || typeof id === 'number' ? String(id) : null);

export function getItemMetadata(entry, metadataMap = new Map()) {
    const key = normalizeId(entry?.id);
    if (key && metadataMap.has(key)) {
        return { ...metadataMap.get(key), isLoading: false };
    }

    const cached = getCachedItemById(entry?.id);
    if (cached) {
        return { ...cached, isLoading: false };
    }

    return {
        id: entry?.id,
        name: entry?.name || 'Loading item…',
        image: entry?.image ?? null,
        description: entry?.description || '',
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
