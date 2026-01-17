import items from '../pages/inventory/json/items';
import { onBrowserAsync } from './ssr.js';

export function mergeItemLists(builtInItems = [], customItems = []) {
    return [...builtInItems, ...customItems];
}

export function filterItemsByQuery(itemList = [], query = '') {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
        return itemList;
    }

    const words = normalizedQuery.split(/\s+/);
    const normalizeValue = (value) => (value == null ? '' : String(value).toLowerCase());
    return itemList.filter((item) => {
        const safeItem = item ?? {};
        const itemText = [
            normalizeValue(safeItem.id),
            normalizeValue(safeItem.name),
            normalizeValue(safeItem.description),
            normalizeValue(safeItem.price),
        ].join(' ');
        return words.every((word) => itemText.includes(word));
    });
}

export async function getMergedItemCatalog({
    builtInItems = items,
    customItemsLoader,
    onError,
} = {}) {
    try {
        const customItems = await onBrowserAsync(async () => {
            try {
                const list = customItemsLoader
                    ? await customItemsLoader()
                    : await (async () => {
                          const { db, ENTITY_TYPES } = await import('./customcontent.js');
                          return db.list(ENTITY_TYPES.ITEM);
                      })();
                return Array.isArray(list) ? list : [];
            } catch (error) {
                if (onError) {
                    onError(error);
                } else {
                    console.warn('Failed to load custom items:', error);
                }
                return [];
            }
        }, []);

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
