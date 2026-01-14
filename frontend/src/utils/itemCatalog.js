import items from '../pages/inventory/json/items';
import { db, ENTITY_TYPES } from './customcontent.js';
import { isBrowser } from './ssr.js';

export function mergeItems(baseItems = [], customItems = []) {
    return [...baseItems, ...customItems];
}

export function filterItemsByQuery(itemsToFilter = [], query = '') {
    const trimmed = query.trim();

    if (!trimmed) {
        return itemsToFilter;
    }

    const words = trimmed.toLowerCase().split(/\s+/);

    return itemsToFilter.filter((item) => {
        const itemText = [
            item.id?.toLowerCase() ?? '',
            item.name?.toLowerCase() ?? '',
            item.description?.toLowerCase() ?? '',
            item.price?.toLowerCase() ?? '',
        ].join(' ');

        return words.every((word) => itemText.includes(word));
    });
}

export async function getMergedItems({ logger = console } = {}) {
    if (!isBrowser) {
        return items;
    }

    try {
        const customItems = await db.list(ENTITY_TYPES.ITEM);
        return mergeItems(items, customItems);
    } catch (error) {
        logger.warn('Failed to load custom items:', error);
        return items;
    }
}
