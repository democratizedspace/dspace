import items from '../../pages/inventory/json/items/index.js';
import { loadGameState, saveGameState } from './common.js';

const itemMap = new Map(items.map((item) => [item.id, item]));

const normalizeCount = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const getContainerDefinition = (containerItemId) => {
    const container = itemMap.get(containerItemId);
    if (!container || !container.itemCounts || typeof container.itemCounts !== 'object') {
        return {};
    }
    return container.itemCounts;
};

export const canStoreItemInContainer = (containerItemId, storedItemId) => {
    if (!containerItemId || !storedItemId) {
        return false;
    }
    const allowedCounts = getContainerDefinition(containerItemId);
    return Object.prototype.hasOwnProperty.call(allowedCounts, storedItemId);
};

export const getStoredItemCounts = (containerItemId) => {
    const allowedCounts = getContainerDefinition(containerItemId);
    const gameState = loadGameState();
    const runtimeMap = gameState.itemContainerCounts?.[containerItemId] ?? {};

    return Object.keys(allowedCounts).reduce((acc, storedItemId) => {
        acc[storedItemId] = Math.max(0, normalizeCount(runtimeMap[storedItemId]));
        return acc;
    }, {});
};

export const getStoredItemCount = (containerItemId, storedItemId) => {
    if (!canStoreItemInContainer(containerItemId, storedItemId)) {
        return 0;
    }
    const counts = getStoredItemCounts(containerItemId);
    return Math.max(0, normalizeCount(counts[storedItemId]));
};

const getOrCreateContainerMap = (gameState, containerItemId) => {
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

export const addStoredItems = (containerItemId, storedItemId, delta) => {
    const parsedDelta = normalizeCount(delta);
    if (!canStoreItemInContainer(containerItemId, storedItemId) || parsedDelta <= 0) {
        return false;
    }

    const gameState = loadGameState();
    const containerMap = getOrCreateContainerMap(gameState, containerItemId);
    const current = Math.max(0, normalizeCount(containerMap[storedItemId]));
    containerMap[storedItemId] = current + parsedDelta;
    saveGameState(gameState);
    return true;
};

export const removeStoredItems = (containerItemId, storedItemId, delta) => {
    const parsedDelta = normalizeCount(delta);
    if (!canStoreItemInContainer(containerItemId, storedItemId) || parsedDelta <= 0) {
        return 0;
    }

    const gameState = loadGameState();
    const containerMap = getOrCreateContainerMap(gameState, containerItemId);
    const current = Math.max(0, normalizeCount(containerMap[storedItemId]));
    const amountRemoved = Math.min(current, parsedDelta);
    containerMap[storedItemId] = Math.max(0, current - amountRemoved);
    saveGameState(gameState);
    return amountRemoved;
};

export const removeAllStoredItems = (containerItemId, storedItemId) => {
    if (!canStoreItemInContainer(containerItemId, storedItemId)) {
        return 0;
    }

    const gameState = loadGameState();
    const containerMap = getOrCreateContainerMap(gameState, containerItemId);
    const current = Math.max(0, normalizeCount(containerMap[storedItemId]));
    containerMap[storedItemId] = 0;
    saveGameState(gameState);
    return current;
};
