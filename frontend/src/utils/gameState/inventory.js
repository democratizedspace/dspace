import { loadGameState, saveGameState } from './common.js';
import items from '../../pages/inventory/json/items';
import {
    adjustContainedItemCount,
    adjustInventoryCount,
    getContainedItemCount,
    getInventoryCountFromEntry,
    supportsContainedItem,
} from './inventoryEntries.js';

const dUSDId = items.find((i) => i.name === 'dUSD')?.id;
const dCarbonId = items.find((i) => i.name === 'dCarbon')?.id;

export const addItems = (items) => {
    const gameState = loadGameState();

    items.forEach(({ id, count }) => {
        adjustInventoryCount(gameState.inventory, id, count);
    });
    saveGameState(gameState);
};

export const burnItems = (items) => {
    const gameState = loadGameState();

    items.forEach(({ id, count }) => {
        const currentCount = getInventoryCountFromEntry(gameState.inventory[id]);
        if (currentCount >= count) {
            adjustInventoryCount(gameState.inventory, id, -count);
        }
    });
    saveGameState(gameState);
};

export const getItemCounts = (itemList) => {
    const gameState = loadGameState();

    const counts = {};
    itemList.forEach((item) => {
        counts[item.id] = getInventoryCountFromEntry(gameState.inventory[item.id]);
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

    const dCarbonCount = getInventoryCountFromEntry(gameState.inventory[dCarbonId]);
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

        const currencyCount = getInventoryCountFromEntry(gameState.inventory[currencyId]);
        if (currencyCount >= totalPrice) {
            adjustInventoryCount(gameState.inventory, currencyId, -totalPrice); // Subtracting the currency for buying.
            adjustInventoryCount(gameState.inventory, item.id, parseFloat(quantity)); // Adding the bought item to inventory.
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

        const itemCount = getInventoryCountFromEntry(gameState.inventory[id]);
        if (itemCount >= quantity) {
            const taxedPrice = price * (1 - taxPercentage / 100);
            const totalPriceAfterTax = taxedPrice * quantity;

            adjustInventoryCount(gameState.inventory, id, -quantity); // Subtracting the sold item from inventory.
            adjustInventoryCount(gameState.inventory, currencyId, totalPriceAfterTax); // Adding the currency from sale.
        }
    });

    saveGameState(gameState);
};

export const hasItems = (itemList) => {
    const gameState = loadGameState();

    for (let i = 0; i < itemList.length; i++) {
        const { id, count } = itemList[i];
        if (getInventoryCountFromEntry(gameState.inventory[id]) < count) {
            return false;
        }
    }
    return true;
};

export const storeItemsInContainer = (containerItemId, itemId, count) => {
    const gameState = loadGameState();
    if (!supportsContainedItem(containerItemId, itemId)) {
        return false;
    }

    adjustContainedItemCount(gameState.inventory, containerItemId, itemId, count);
    saveGameState(gameState);
    return true;
};

export const releaseItemsFromContainer = (containerItemId, itemId, count = 'all') => {
    const gameState = loadGameState();
    if (!supportsContainedItem(containerItemId, itemId)) {
        return 0;
    }

    const available = getContainedItemCount(gameState.inventory, containerItemId, itemId);
    const requested = count === 'all' ? available : Math.max(0, Number.parseFloat(count) || 0);
    const releasable = Math.min(available, requested);

    if (releasable <= 0) {
        return 0;
    }

    adjustContainedItemCount(gameState.inventory, containerItemId, itemId, -releasable);
    adjustInventoryCount(gameState.inventory, itemId, releasable);
    saveGameState(gameState);
    return releasable;
};
