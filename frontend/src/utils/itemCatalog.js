import items from '../pages/inventory/json/items';
import { db, ENTITY_TYPES } from './customcontent.js';
import { onBrowserAsync } from './ssr.js';

export async function getMergedItems({ baseItems = items, customItems } = {}) {
    const normalizedBaseItems = Array.isArray(baseItems) ? baseItems : [];

    if (Array.isArray(customItems)) {
        return [...normalizedBaseItems, ...customItems];
    }

    const loadedCustomItems = await onBrowserAsync(async () => {
        const list = await db.list(ENTITY_TYPES.ITEM);
        return Array.isArray(list) ? list : [];
    }, []);

    return [...normalizedBaseItems, ...loadedCustomItems];
}

export function filterItemsByQuery(itemsList, query) {
    const sourceItems = Array.isArray(itemsList) ? itemsList : [];
    const trimmedQuery = query?.trim?.() ?? '';

    if (!trimmedQuery) {
        return sourceItems;
    }

    const words = trimmedQuery.toLowerCase().split(/\s+/);
    return sourceItems.filter((item) => {
        const itemText = [
            item.id?.toLowerCase() ?? '',
            item.name?.toLowerCase() ?? '',
            item.description?.toLowerCase() ?? '',
            item.price?.toLowerCase() ?? '',
        ].join(' ');
        return words.every((word) => itemText.includes(word));
    });
}
