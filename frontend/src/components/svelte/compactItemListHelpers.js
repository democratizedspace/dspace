import items from '../../pages/inventory/json/items';

const FALLBACK_NAME = 'Unknown item';
const FALLBACK_DESCRIPTION = 'Custom item';
const builtInItems = new Map(items.map((item) => [String(item.id), item]));

export function getItemMetadata(entry, itemMap) {
    const key =
        typeof entry?.id === 'string' || typeof entry?.id === 'number' ? String(entry.id) : '';
    const knownItem = itemMap?.get(key);

    if (knownItem) {
        return knownItem;
    }

    const builtInItem = builtInItems.get(key);
    if (builtInItem) {
        return {
            id: key,
            name: builtInItem.name || FALLBACK_NAME,
            image: builtInItem.image || null,
            description: builtInItem.description || FALLBACK_DESCRIPTION,
            loading: false,
            missing: false,
            releaseImage: null,
        };
    }

    return {
        id: entry?.id ?? key,
        name: entry?.name || FALLBACK_NAME,
        image: entry?.image || null,
        description: entry?.description || FALLBACK_DESCRIPTION,
        loading: Boolean(itemMap),
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
