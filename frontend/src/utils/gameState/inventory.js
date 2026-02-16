import { loadGameState, saveGameState } from './common.js';
import items from '../../pages/inventory/json/items';

const dUSDId = items.find((i) => i.name === 'dUSD')?.id;
const dCarbonId = items.find((i) => i.name === 'dCarbon')?.id;

const itemDefinitionById = new Map(items.map((item) => [item.id, item]));

const normalizeCount = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeContainerMap = (value) => {
    if (!value || typeof value !== 'object') {
        return {};
    }

    return Object.entries(value).reduce((acc, [itemId, count]) => {
        const normalized = normalizeCount(count);
        if (normalized > 0) {
            acc[itemId] = normalized;
        }
        return acc;
    }, {});
};

export const getConfiguredItemCounts = (containerItemId) => {
    const containerItem = itemDefinitionById.get(containerItemId);
    if (!containerItem?.itemCounts || typeof containerItem.itemCounts !== 'object') {
        return {};
    }

    return Object.entries(containerItem.itemCounts).reduce((acc, [itemId, count]) => {
        acc[itemId] = normalizeCount(count);
        return acc;
    }, {});
};

export const isContainerItemAllowed = (containerItemId, storedItemId) => {
    const configured = getConfiguredItemCounts(containerItemId);
    return Object.prototype.hasOwnProperty.call(configured, storedItemId);
};

export const getContainerItemCounts = (containerItemId) => {
    const gameState = loadGameState();
    const configured = getConfiguredItemCounts(containerItemId);
    const persisted = normalizeContainerMap(gameState.itemContainerCounts?.[containerItemId]);

    return Object.entries(configured).reduce((acc, [itemId, defaultCount]) => {
        acc[itemId] = normalizeCount(persisted[itemId] ?? defaultCount);
        return acc;
    }, {});
};

export const getContainerItemCount = (containerItemId, storedItemId) => {
    const counts = getContainerItemCounts(containerItemId);
    return normalizeCount(counts[storedItemId]);
};

const ensureContainerInState = (gameState, containerItemId) => {
    if (!gameState.itemContainerCounts || typeof gameState.itemContainerCounts !== 'object') {
        gameState.itemContainerCounts = {};
    }

    if (!gameState.itemContainerCounts[containerItemId]) {
        gameState.itemContainerCounts[containerItemId] = {};
    }

    const configured = getConfiguredItemCounts(containerItemId);
    Object.entries(configured).forEach(([itemId, defaultCount]) => {
        if (gameState.itemContainerCounts[containerItemId][itemId] === undefined) {
            gameState.itemContainerCounts[containerItemId][itemId] = normalizeCount(defaultCount);
        }
    });

    return gameState.itemContainerCounts[containerItemId];
};

const adjustContainerItemCount = (gameState, containerItemId, storedItemId, delta) => {
    if (!isContainerItemAllowed(containerItemId, storedItemId)) {
        throw new Error(
            `Item ${storedItemId} is not configured in itemCounts for container ${containerItemId}.`
        );
    }

    const containerCounts = ensureContainerInState(gameState, containerItemId);
    const current = normalizeCount(containerCounts[storedItemId]);
    const next = current + normalizeCount(delta);

    if (next < -1e-9) {
        throw new Error(
            `Container ${containerItemId} does not have enough ${storedItemId}. Current=${current}, delta=${delta}`
        );
    }

    containerCounts[storedItemId] = Math.max(0, next);
};

const normalizeItemEntry = (entry) => {
    const id = typeof entry?.id === 'string' ? entry.id.trim() : '';
    const count = normalizeCount(entry?.count);

    return { id, count };
};

export const addItems = (items) => {
    const gameState = loadGameState();

    items.forEach((entry) => {
        const { id, count } = normalizeItemEntry(entry);
        if (!id || count <= 0) {
            return;
        }

        gameState.inventory[id] = (gameState.inventory[id] || 0) + count;
    });
    saveGameState(gameState);
};

export const burnItems = (items) => {
    const gameState = loadGameState();

    items.forEach((entry) => {
        const { id, count } = normalizeItemEntry(entry);
        if (!id || count <= 0) {
            return;
        }

        if (gameState.inventory[id] && gameState.inventory[id] >= count) {
            gameState.inventory[id] -= count;
        }
    });
    saveGameState(gameState);
};

export const moveInventoryItemToContainer = (containerItemId, storedItemId, count) => {
    const gameState = loadGameState();
    const parsedCount = normalizeCount(count);

    if (!containerItemId || !storedItemId || parsedCount <= 0) {
        return false;
    }

    if (!gameState.inventory[containerItemId] || gameState.inventory[containerItemId] < 1) {
        return false;
    }

    if (!gameState.inventory[storedItemId] || gameState.inventory[storedItemId] < parsedCount) {
        return false;
    }

    adjustContainerItemCount(gameState, containerItemId, storedItemId, parsedCount);
    gameState.inventory[storedItemId] -= parsedCount;
    saveGameState(gameState);
    return true;
};

export const moveContainerItemToInventory = (containerItemId, storedItemId, count) => {
    const gameState = loadGameState();
    const parsedCount = normalizeCount(count);

    if (!containerItemId || !storedItemId || parsedCount <= 0) {
        return false;
    }

    const available = normalizeCount(getContainerItemCount(containerItemId, storedItemId));
    if (available < parsedCount) {
        return false;
    }

    adjustContainerItemCount(gameState, containerItemId, storedItemId, -parsedCount);
    gameState.inventory[storedItemId] = (gameState.inventory[storedItemId] || 0) + parsedCount;
    saveGameState(gameState);
    return true;
};

export const withdrawAllFromContainerToInventory = (containerItemId, storedItemId) => {
    const amount = getContainerItemCount(containerItemId, storedItemId);
    if (amount <= 0) {
        return 0;
    }

    moveContainerItemToInventory(containerItemId, storedItemId, amount);
    return amount;
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
            gameState.inventory[currencyId] -= totalPrice;
            gameState.inventory[item.id] =
                (gameState.inventory[item.id] || 0) + parseFloat(quantity);
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

            gameState.inventory[id] -= quantity;
            gameState.inventory[currencyId] += totalPriceAfterTax;
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
