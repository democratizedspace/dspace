import items from '../pages/inventory/json/items';
import { db, ENTITY_TYPES } from './customcontent.js';

export function mergeItemLists(builtInItems = [], customItems = []) {
    return [...builtInItems, ...customItems];
}

export function filterItemsByQuery(itemList = [], query = '') {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
        return itemList;
    }

    const words = normalizedQuery.split(/\s+/);
    return itemList.filter((item) => {
        const itemText = [
            item.id?.toLowerCase?.() ?? '',
            item.name?.toLowerCase?.() ?? '',
            item.description?.toLowerCase?.() ?? '',
            item.price?.toLowerCase?.() ?? '',
        ].join(' ');
        return words.every((word) => itemText.includes(word));
    });
}

export async function getMergedItemCatalog({
    builtInItems = items,
    customItemsLoader = () => db.list(ENTITY_TYPES.ITEM),
    onError,
} = {}) {
    try {
        const customItems = await customItemsLoader();
        return mergeItemLists(builtInItems, customItems);
    } catch (error) {
        if (onError) {
            onError(error);
        } else {
            console.warn('Failed to load custom items:', error);
        }
        return builtInItems;
    }
}
