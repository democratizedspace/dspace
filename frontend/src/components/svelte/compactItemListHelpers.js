import items from '../../pages/inventory/json/items';

const DEFAULT_PLACEHOLDER = {
    name: 'Loading item…',
    description: '',
    image: null,
    isLoading: true,
};

const normalizeId = (id) => (typeof id === 'string' || typeof id === 'number' ? String(id) : '');

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

export function buildFullItemList(itemList, totals = {}, itemMetadataMap = new Map()) {
    return itemList.map((item) => {
        const key = normalizeId(item.id);
        const metadata = key ? itemMetadataMap.get(key) : null;
        const hasCount = Object.prototype.hasOwnProperty.call(item, 'count');
        const rawCount =
            hasCount && item.count !== undefined && item.count !== null ? Number(item.count) : null;

        const resolvedMetadata = metadata
            ? {
                  ...metadata,
                  isLoading: false,
              }
            : {
                  id: item.id,
                  ...DEFAULT_PLACEHOLDER,
              };

        return {
            ...resolvedMetadata,
            count:
                rawCount !== null && Number.isFinite(rawCount) ? Number(rawCount.toFixed(5)) : null,
            total: totals[item.id] ?? 0,
        };
    });
}
