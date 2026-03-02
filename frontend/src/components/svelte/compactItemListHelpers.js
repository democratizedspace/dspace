const FALLBACK_NAME = 'Unknown item';
const FALLBACK_DESCRIPTION = 'Custom item';
const FALLBACK_IMAGE = '/favicon.ico';

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
        image: entry?.image || FALLBACK_IMAGE,
        description: entry?.description || FALLBACK_DESCRIPTION,
        loading: Boolean(itemMap),
        missing: Boolean(itemMap),
        releaseImage: null,
    };
}

export function buildFullItemList(itemList, totals = {}, itemMap = new Map()) {
    return itemList.map((item) => {
        const metadata = getItemMetadata(item, itemMap);
        const hasContainerMetadata = item?.containerItemId
            ? itemMap?.has(String(item.containerItemId))
            : false;
        const containerMetadata = hasContainerMetadata
            ? getItemMetadata({ id: item.containerItemId }, itemMap)
            : null;
        const hasCount = Object.prototype.hasOwnProperty.call(item, 'count');
        const rawCount =
            hasCount && item.count !== undefined && item.count !== null ? Number(item.count) : null;

        return {
            ...metadata,
            containerItemId: item?.containerItemId,
            containerName:
                containerMetadata && !containerMetadata.missing && !containerMetadata.loading
                    ? containerMetadata.name ?? null
                    : null,
            count:
                rawCount !== null && Number.isFinite(rawCount) ? Number(rawCount.toFixed(5)) : null,
            total: totals[item.id] ?? 0,
        };
    });
}
