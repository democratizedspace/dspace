import {
    loadGameState,
    saveGameState,
    getGameStateChecksum,
    syncGameStateFromLocalIfStale,
    LS_STATE_KEY,
} from './common.js';
import items from '../../pages/inventory/json/items';
import {
    addStoredItems,
    getStoredItemCount,
    getStoredItemCounts,
    removeAllStoredItems,
} from './itemContainers.js';

const loadFreshStateForMutation = () => {
    const checksum = getGameStateChecksum();
    syncGameStateFromLocalIfStale(checksum);
    return loadGameState();
};
const dUSDId = items.find((i) => i.name === 'dUSD')?.id;
const dCarbonId = items.find((i) => i.name === 'dCarbon')?.id;

export const addItems = (items) => {
    const gameState = loadFreshStateForMutation();

    items.forEach(({ id, count }) => {
        gameState.inventory[id] = (gameState.inventory[id] || 0) + count;
    });
    saveGameState(gameState);
};

export const burnItems = (items) => {
    const gameState = loadFreshStateForMutation();

    items.forEach(({ id, count }) => {
        if (gameState.inventory[id] && gameState.inventory[id] >= count) {
            gameState.inventory[id] -= count;
        }
    });
    saveGameState(gameState);
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

export const getPersistedItemCount = (itemId) => {
    if (typeof window === 'undefined') {
        return 0;
    }

    try {
        const raw = localStorage.getItem(LS_STATE_KEY);
        if (!raw) {
            return 0;
        }

        const parsed = JSON.parse(raw);
        return Number(parsed?.inventory?.[itemId] ?? 0);
    } catch (error) {
        return 0;
    }
};

export const getPersisteddUSD = () => getPersistedItemCount(dUSDId);

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

export const buyItems = (items) => {
    const gameState = loadFreshStateForMutation();

    items.forEach((item) => {
        const { price, quantity } = item;
        const currencyId = item.currencyId ?? dUSDId;

        const parsedPrice = parseFloat(price);
        const parsedQuantity = parseFloat(quantity);
        const totalPrice = parsedPrice * parsedQuantity;

        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) return;
        if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return;
        if (!currencyId) return;

        if (gameState.inventory[currencyId] && gameState.inventory[currencyId] >= totalPrice) {
            gameState.inventory[currencyId] -= totalPrice; // Subtracting the currency for buying.
            gameState.inventory[item.id] = (gameState.inventory[item.id] || 0) + parsedQuantity; // Adding the bought item to inventory.
        }
    });

    saveGameState(gameState);
};

export const sellItems = (items) => {
    const gameState = loadFreshStateForMutation();
    const currencyId = dUSDId;
    const taxPercentage = getSalesTaxPercentage();

    items.forEach((item) => {
        const { id, quantity, price } = item;

        if (price === undefined) return;
        if (quantity <= 0 || price <= 0) return;

        if (gameState.inventory[id] && gameState.inventory[id] >= quantity) {
            const taxedPrice = price * (1 - taxPercentage / 100);
            const totalPriceAfterTax = taxedPrice * quantity;

            gameState.inventory[id] -= quantity; // Subtracting the sold item from inventory.
            gameState.inventory[currencyId] += totalPriceAfterTax; // Adding the currency from sale.
        }
    });

    saveGameState(gameState);
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
