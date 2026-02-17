import { loadGameState, saveGameState } from './common.js';
import items from '../../pages/inventory/json/items';

const itemMap = new Map(items.map((item) => [item.id, item]));

const normalizeCount = (value) => {
    const count = Number(value);
    return Number.isFinite(count) && count >= 0 ? count : 0;
};

const getContainerDefinition = (containerItemId) => {
    if (typeof containerItemId !== 'string' || !containerItemId) {
        return null;
    }
    const container = itemMap.get(containerItemId);
    if (!container || typeof container.itemCounts !== 'object' || !container.itemCounts) {
        return null;
    }
    return container;
};

const getAllowedStoredItemIds = (containerItemId) => {
    const container = getContainerDefinition(containerItemId);
    if (!container) {
        return [];
    }
    return Object.keys(container.itemCounts);
};

export const canStoreItemInContainer = (containerItemId, storedItemId) => {
    if (typeof storedItemId !== 'string' || !storedItemId) {
        return false;
    }
    return getAllowedStoredItemIds(containerItemId).includes(storedItemId);
};

const getStoredMapForContainer = (gameState, containerItemId) => {
    if (!gameState.itemContainerCounts || typeof gameState.itemContainerCounts !== 'object') {
        gameState.itemContainerCounts = {};
    }

    if (
        !gameState.itemContainerCounts[containerItemId] ||
        typeof gameState.itemContainerCounts[containerItemId] !== 'object'
    ) {
        gameState.itemContainerCounts[containerItemId] = {};
    }

    return gameState.itemContainerCounts[containerItemId];
};

export const getStoredItemCounts = (containerItemId) => {
    const allowedItemIds = getAllowedStoredItemIds(containerItemId);
    if (allowedItemIds.length === 0) {
        return {};
    }

    const gameState = loadGameState();
    const runtimeMap = gameState.itemContainerCounts?.[containerItemId] ?? {};

    return allowedItemIds.reduce((acc, itemId) => {
        acc[itemId] = normalizeCount(runtimeMap[itemId]);
        return acc;
    }, {});
};

export const getStoredItemCount = (containerItemId, storedItemId) => {
    if (!canStoreItemInContainer(containerItemId, storedItemId)) {
        return 0;
    }
    const counts = getStoredItemCounts(containerItemId);
    return normalizeCount(counts[storedItemId]);
};

export const addStoredItems = (containerItemId, storedItemId, delta) => {
    const amount = Number(delta);
    if (!canStoreItemInContainer(containerItemId, storedItemId)) {
        return false;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
        return false;
    }

    const gameState = loadGameState();
    const storedMap = getStoredMapForContainer(gameState, containerItemId);
    storedMap[storedItemId] = normalizeCount(storedMap[storedItemId]) + amount;
    saveGameState(gameState);
    return true;
};

export const removeStoredItems = (containerItemId, storedItemId, delta) => {
    const amount = Number(delta);
    if (!canStoreItemInContainer(containerItemId, storedItemId)) {
        return 0;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
        return 0;
    }

    const gameState = loadGameState();
    const storedMap = getStoredMapForContainer(gameState, containerItemId);
    const current = normalizeCount(storedMap[storedItemId]);
    const removed = Math.min(current, amount);
    storedMap[storedItemId] = Math.max(0, current - removed);
    saveGameState(gameState);
    return removed;
};

export const removeAllStoredItems = (containerItemId, storedItemId) => {
    if (!canStoreItemInContainer(containerItemId, storedItemId)) {
        return 0;
    }

    const gameState = loadGameState();
    const storedMap = getStoredMapForContainer(gameState, containerItemId);
    const removed = normalizeCount(storedMap[storedItemId]);
    storedMap[storedItemId] = 0;
    saveGameState(gameState);
    return removed;
};
