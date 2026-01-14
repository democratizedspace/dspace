import items from '../pages/inventory/json/items';
import { db, ENTITY_TYPES } from './customcontent.js';
import { onBrowserAsync } from './ssr.js';

export async function getMergedItems() {
    return onBrowserAsync(
        async () => {
            try {
                const customItems = await db.list(ENTITY_TYPES.ITEM);
                return [...items, ...customItems];
            } catch (error) {
                console.warn('Failed to load custom items:', error);
                return items;
            }
        },
        items
    );
}

export function filterItemsByQuery(itemList, query) {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
        return itemList;
    }

    const words = normalizedQuery.split(/\s+/);

    return itemList.filter((item) => {
        const itemText = [
            item.id?.toLowerCase() ?? '',
            item.name?.toLowerCase() ?? '',
            item.description?.toLowerCase() ?? '',
            item.price?.toLowerCase() ?? '',
        ].join(' ');
        return words.every((word) => itemText.includes(word));
    });
}
