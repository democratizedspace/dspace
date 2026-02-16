import items from '../../pages/inventory/json/items';

const itemMap = new Map(items.map((item) => [item.id, item]));

const toFiniteNumber = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const getContainerTemplate = (itemId) => {
    const definition = itemMap.get(itemId);
    if (
        !definition ||
        typeof definition.itemCounts !== 'object' ||
        definition.itemCounts === null
    ) {
        return null;
    }

    const normalized = Object.entries(definition.itemCounts).reduce(
        (acc, [containedItemId, count]) => {
            if (typeof containedItemId !== 'string' || containedItemId.trim().length === 0) {
                return acc;
            }
            acc[containedItemId] = Math.max(0, toFiniteNumber(count));
            return acc;
        },
        {}
    );

    return Object.keys(normalized).length > 0 ? normalized : null;
};

export const getInventoryCountFromEntry = (entry) => {
    if (typeof entry === 'number') {
        return toFiniteNumber(entry);
    }
    if (entry && typeof entry === 'object') {
        return toFiniteNumber(entry.count);
    }
    return 0;
};

export const cloneItemCounts = (value) => {
    if (!value || typeof value !== 'object') {
        return {};
    }

    return Object.entries(value).reduce((acc, [itemId, count]) => {
        acc[itemId] = Math.max(0, toFiniteNumber(count));
        return acc;
    }, {});
};

export const normalizeInventoryEntry = (itemId, entry) => {
    const template = getContainerTemplate(itemId);
    const count = getInventoryCountFromEntry(entry);

    if (!template) {
        return count;
    }

    const existingItemCounts = cloneItemCounts(entry?.itemCounts);
    const mergedItemCounts = { ...template, ...existingItemCounts };
    return {
        count,
        itemCounts: mergedItemCounts,
    };
};

export const getContainedItemCount = (inventory, containerItemId, containedItemId) => {
    const normalizedEntry = normalizeInventoryEntry(containerItemId, inventory?.[containerItemId]);
    if (!normalizedEntry || typeof normalizedEntry !== 'object') {
        return 0;
    }

    return toFiniteNumber(normalizedEntry.itemCounts?.[containedItemId]);
};

export const supportsContainedItem = (containerItemId, containedItemId) => {
    const template = getContainerTemplate(containerItemId);
    return Boolean(template && Object.hasOwn(template, containedItemId));
};

export const setInventoryCount = (inventory, itemId, nextCount) => {
    inventory[itemId] = normalizeInventoryEntry(itemId, {
        ...(typeof inventory[itemId] === 'object' && inventory[itemId] !== null
            ? inventory[itemId]
            : {}),
        count: Math.max(0, toFiniteNumber(nextCount)),
    });
};

export const adjustInventoryCount = (inventory, itemId, delta) => {
    const currentCount = getInventoryCountFromEntry(inventory[itemId]);
    const nextCount = Math.max(0, currentCount + toFiniteNumber(delta));
    setInventoryCount(inventory, itemId, nextCount);
};

export const adjustContainedItemCount = (inventory, containerItemId, containedItemId, delta) => {
    if (!supportsContainedItem(containerItemId, containedItemId)) {
        throw new Error(
            `Container item "${containerItemId}" does not support contained item "${containedItemId}"`
        );
    }

    const entry = normalizeInventoryEntry(containerItemId, inventory[containerItemId]);
    if (typeof entry !== 'object' || entry === null) {
        throw new Error(`Expected normalized container entry for "${containerItemId}"`);
    }

    const currentValue = toFiniteNumber(entry.itemCounts?.[containedItemId]);
    const nextValue = Math.max(0, currentValue + toFiniteNumber(delta));

    inventory[containerItemId] = {
        ...entry,
        itemCounts: {
            ...entry.itemCounts,
            [containedItemId]: nextValue,
        },
    };

    return nextValue;
};
