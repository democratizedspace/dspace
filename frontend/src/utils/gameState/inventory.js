import { loadGameState, saveGameState } from './common.js';
import items from '../../pages/inventory/json/items';

const dUSDId = items.find((i) => i.name === 'dUSD')?.id;
const dCarbonId = items.find((i) => i.name === 'dCarbon')?.id;

export const addItems = (items) => {
    const gameState = loadGameState();

    items.forEach(({ id, count }) => {
        gameState.inventory[id] = (gameState.inventory[id] || 0) + count;
    });
    saveGameState(gameState);
};

export const burnItems = (items) => {
    const gameState = loadGameState();

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
        counts[item.id] = gameState.inventory[item.id] || 0;
    });
    return counts;
};

export const getItemCount = (itemId) => {
    return getItemCounts([{ id: itemId }])[itemId];
};

const getContainerMap = (gameState, containerItemId) => {
    const maps = gameState.itemContainerCounts || {};
    const existing = maps[containerItemId];
    if (!existing || typeof existing !== 'object') {
        maps[containerItemId] = {};
        gameState.itemContainerCounts = maps;
        return maps[containerItemId];
    }
    return existing;
};

export const getContainedItemCount = (containerItemId, itemId) => {
    const gameState = loadGameState();
    const containerMap = gameState.itemContainerCounts?.[containerItemId];
    return Number(containerMap?.[itemId] || 0);
};

export const getContainedItemCounts = (containerItemId, itemIds = []) => {
    const gameState = loadGameState();
    const containerMap = gameState.itemContainerCounts?.[containerItemId] || {};

    return itemIds.reduce((acc, itemId) => {
        acc[itemId] = Number(containerMap[itemId] || 0);
        return acc;
    }, {});
};

export const addContainedItems = (containerItemId, itemId, count) => {
    const normalizedCount = Number(count);
    if (!Number.isFinite(normalizedCount) || normalizedCount <= 0) {
        return;
    }

    const gameState = loadGameState();
    const containerMap = getContainerMap(gameState, containerItemId);
    containerMap[itemId] = Number(containerMap[itemId] || 0) + normalizedCount;
    saveGameState(gameState);
};

export const clearContainedItemCount = (containerItemId, itemId) => {
    const gameState = loadGameState();
    const containerMap = getContainerMap(gameState, containerItemId);
    containerMap[itemId] = 0;
    saveGameState(gameState);
};

export const getCurrentdUSD = () => {
    return getItemCount(dUSDId);
};

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
    const gameState = loadGameState();

    items.forEach((item) => {
        const { price, quantity } = item;
        const currencyId = dUSDId;

        const totalPrice = parseFloat(price) * parseFloat(quantity);

        if (gameState.inventory[currencyId] && gameState.inventory[currencyId] >= totalPrice) {
            gameState.inventory[currencyId] -= totalPrice; // Subtracting the currency for buying.
            gameState.inventory[item.id] =
                (gameState.inventory[item.id] || 0) + parseFloat(quantity); // Adding the bought item to inventory.
        }
    });

    saveGameState(gameState);
};

export const sellItems = (items) => {
    const gameState = loadGameState();
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
