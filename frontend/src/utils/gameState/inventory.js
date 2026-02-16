import { loadGameState, saveGameState } from './common.js';
import items from '../../pages/inventory/json/items';

const dUSDId = items.find((i) => i.name === 'dUSD')?.id;
const dCarbonId = items.find((i) => i.name === 'dCarbon')?.id;
const containerItemCountMap = new Map(
    items
        .filter((item) => item?.itemCounts && typeof item.itemCounts === 'object')
        .map((item) => [item.id, Object.keys(item.itemCounts)])
);

const normalizeCount = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const getContainerSupportedItemIds = (containerId) => containerItemCountMap.get(containerId) ?? [];

const ensureContainerCountPath = (gameState, containerId, itemId) => {
    if (!gameState.itemCounts || typeof gameState.itemCounts !== 'object') {
        gameState.itemCounts = {};
    }

    if (
        !gameState.itemCounts[containerId] ||
        typeof gameState.itemCounts[containerId] !== 'object'
    ) {
        gameState.itemCounts[containerId] = {};
    }

    if (typeof gameState.itemCounts[containerId][itemId] !== 'number') {
        gameState.itemCounts[containerId][itemId] = 0;
    }
};

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

export const supportsContainerItem = (containerId, itemId) => {
    const supportedItemIds = getContainerSupportedItemIds(containerId);
    return supportedItemIds.includes(itemId);
};

export const getContainerItemCount = (containerId, itemId) => {
    if (!supportsContainerItem(containerId, itemId)) {
        return 0;
    }

    const gameState = loadGameState();
    const stored = gameState.itemCounts?.[containerId]?.[itemId];
    return normalizeCount(stored);
};

export const getContainerItemCounts = (containerId) => {
    const supportedItemIds = getContainerSupportedItemIds(containerId);
    if (supportedItemIds.length === 0) {
        return {};
    }

    const gameState = loadGameState();
    const counts = {};

    supportedItemIds.forEach((itemId) => {
        counts[itemId] = normalizeCount(gameState.itemCounts?.[containerId]?.[itemId]);
    });

    return counts;
};

export const addContainerItems = (containerId, itemId, count) => {
    if (!supportsContainerItem(containerId, itemId)) {
        return false;
    }

    const delta = normalizeCount(count);
    if (delta <= 0) {
        return false;
    }

    const gameState = loadGameState();
    ensureContainerCountPath(gameState, containerId, itemId);
    gameState.itemCounts[containerId][itemId] += delta;
    saveGameState(gameState);
    return true;
};

export const removeContainerItems = (containerId, itemId, count) => {
    if (!supportsContainerItem(containerId, itemId)) {
        return false;
    }

    const delta = normalizeCount(count);
    if (delta <= 0) {
        return false;
    }

    const gameState = loadGameState();
    ensureContainerCountPath(gameState, containerId, itemId);

    const currentCount = normalizeCount(gameState.itemCounts[containerId][itemId]);
    if (currentCount < delta) {
        return false;
    }

    gameState.itemCounts[containerId][itemId] = currentCount - delta;
    saveGameState(gameState);
    return true;
};
