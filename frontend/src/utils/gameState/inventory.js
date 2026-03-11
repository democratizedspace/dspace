import {
    loadGameState,
    runGameStateMutation,
    getPersistedInventoryItemCount,
} from './common.js';
import items from '../../pages/inventory/json/items';
import {
    addStoredItems,
    getStoredItemCount,
    getStoredItemCounts,
    removeAllStoredItems,
} from './itemContainers.js';

const dUSDId = items.find((i) => i.name === 'dUSD')?.id;
const dCarbonId = items.find((i) => i.name === 'dCarbon')?.id;

export const addItems = async (items, options = {}) => {
    await runGameStateMutation((gameState) => {
        items.forEach(({ id, count }) => {
            gameState.inventory[id] = (gameState.inventory[id] || 0) + count;
        });
    }, options);
};

export const burnItems = async (items, options = {}) => {
    await runGameStateMutation((gameState) => {
        items.forEach(({ id, count }) => {
            if (gameState.inventory[id] && gameState.inventory[id] >= count) {
                gameState.inventory[id] -= count;
            }
        });
    }, options);
};

export const getItemCounts = (itemList) => {
    const gameState = loadGameState();

    const counts = {};
    itemList.forEach((item) => {
        if (item.containerItemId) {
            counts[item.id] = getContainedItemCount(item.containerItemId, item.id);
            return;
        }

        counts[item.id] = gameState.inventory[item.id] || 0;
    });
    return counts;
};

export const getItemCount = (itemId) => {
    return getItemCounts([{ id: itemId }])[itemId];
};

export const getContainedItemCount = (containerItemId, itemId) => {
    return getStoredItemCount(containerItemId, itemId);
};

export const getContainedItemCounts = (containerItemId, itemIds = []) => {
    const allCounts = getStoredItemCounts(containerItemId);
    return itemIds.reduce((acc, itemId) => {
        acc[itemId] = Number(allCounts[itemId] ?? 0);
        return acc;
    }, {});
};

export const addContainedItems = (containerItemId, itemId, count) => {
    addStoredItems(containerItemId, itemId, count);
};

export const clearContainedItemCount = (containerItemId, itemId) => {
    removeAllStoredItems(containerItemId, itemId);
};

export const getCurrentdUSD = () => {
    return getItemCount(dUSDId);
};

export const getCurrentdUSDPersisted = async () => getPersistedInventoryItemCount(dUSDId);

export const getSalesTaxPercentage = () => {
    const gameState = loadGameState();

    if (!dCarbonId) {
        return 0;
    }

    const dCarbonCount = gameState.inventory[dCarbonId] || 0;
    if (dCarbonCount <= 0) {
        return 0;
    }

    return Math.min(dCarbonCount / 1000, 90);
};

export const buyItems = async (items, options = {}) => {
    await runGameStateMutation((gameState) => {
        items.forEach((item) => {
            const { price, quantity } = item;
            const currencyId = dUSDId;

            const parsedPrice = parseFloat(price);
            const parsedQuantity = parseFloat(quantity);
            const totalPrice = parsedPrice * parsedQuantity;

            if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) return;
            if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return;

            if (gameState.inventory[currencyId] && gameState.inventory[currencyId] >= totalPrice) {
                gameState.inventory[currencyId] -= totalPrice;
                gameState.inventory[item.id] = (gameState.inventory[item.id] || 0) + parsedQuantity;
            }
        });
    }, options);
};

export const sellItems = async (items, options = {}) => {
    const taxPercentage = getSalesTaxPercentage();

    await runGameStateMutation((gameState) => {
        const currencyId = dUSDId;
        items.forEach((item) => {
            const { id, quantity, price } = item;

            if (price === undefined) return;
            if (quantity <= 0 || price <= 0) return;

            if (gameState.inventory[id] && gameState.inventory[id] >= quantity) {
                const taxedPrice = price * (1 - taxPercentage / 100);
                const totalPriceAfterTax = taxedPrice * quantity;

                gameState.inventory[id] -= quantity;
                gameState.inventory[currencyId] += totalPriceAfterTax;
            }
        });
    }, options);
};

export const hasItems = (itemList) => {
    const gameState = loadGameState();

    for (let i = 0; i < itemList.length; i++) {
        const { id, count } = itemList[i];
        if (!gameState.inventory[id] || gameState.inventory[id] < count) {
            return false;
        }
    }
    return true;
};
