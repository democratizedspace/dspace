import items from '../../pages/inventory/json/items';
import { loadGameState, saveGameState } from './common.js';

const itemMap = new Map(items.map((item) => [item.id, item]));

const normalizePositiveNumber = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }
    return parsed;
};

const getAllowedStoredItemIds = (containerItemId) => {
    if (!containerItemId) {
        return [];
    }

    const container = itemMap.get(containerItemId);
    if (!container?.itemCounts || typeof container.itemCounts !== 'object') {
        return [];
    }

    return Object.keys(container.itemCounts);
};

const ensureContainerMap = (gameState, containerItemId) => {
    const containerMaps = gameState.itemContainerCounts || {};
    const existing = containerMaps[containerItemId];
    if (!existing || typeof existing !== 'object') {
        containerMaps[containerItemId] = {};
    }
    gameState.itemContainerCounts = containerMaps;
    return gameState.itemContainerCounts[containerItemId];
};

export const canStoreItemInContainer = (containerItemId, storedItemId) => {
    if (!containerItemId || !storedItemId) {
        return false;
    }

    return getAllowedStoredItemIds(containerItemId).includes(storedItemId);
};

export const getStoredItemCounts = (containerItemId) => {
    const allowedItemIds = getAllowedStoredItemIds(containerItemId);
    if (allowedItemIds.length === 0) {
        return {};
    }

    const gameState = loadGameState();
    const runtimeCounts = gameState.itemContainerCounts?.[containerItemId] || {};

    return allowedItemIds.reduce((acc, itemId) => {
        const count = Number(runtimeCounts[itemId] || 0);
        acc[itemId] = Number.isFinite(count) && count >= 0 ? count : 0;
        return acc;
    }, {});
};

export const getStoredItemCount = (containerItemId, storedItemId) => {
    if (!canStoreItemInContainer(containerItemId, storedItemId)) {
        return 0;
    }

    const counts = getStoredItemCounts(containerItemId);
    return Number(counts[storedItemId] || 0);
};

export const addStoredItems = (containerItemId, storedItemId, delta) => {
    if (!canStoreItemInContainer(containerItemId, storedItemId)) {
        return false;
    }

    const amountToAdd = normalizePositiveNumber(delta);
    if (amountToAdd === null) {
        return false;
    }

    const gameState = loadGameState();
    const containerMap = ensureContainerMap(gameState, containerItemId);
    const current = Number(containerMap[storedItemId] || 0);
    containerMap[storedItemId] = Math.max(0, current) + amountToAdd;
    saveGameState(gameState);
    return true;
};

export const removeStoredItems = (containerItemId, storedItemId, delta) => {
    if (!canStoreItemInContainer(containerItemId, storedItemId)) {
        return 0;
    }

    const amountToRemove = normalizePositiveNumber(delta);
    if (amountToRemove === null) {
        return 0;
    }

    const gameState = loadGameState();
    const containerMap = ensureContainerMap(gameState, containerItemId);
    const current = Number(containerMap[storedItemId] || 0);
    const safeCurrent = Number.isFinite(current) && current > 0 ? current : 0;
    const removed = Math.min(safeCurrent, amountToRemove);

    containerMap[storedItemId] = Math.max(0, safeCurrent - removed);
    saveGameState(gameState);

    return removed;
};

export const removeAllStoredItems = (containerItemId, storedItemId) => {
    if (!canStoreItemInContainer(containerItemId, storedItemId)) {
        return 0;
    }

    const gameState = loadGameState();
    const containerMap = ensureContainerMap(gameState, containerItemId);
    const current = Number(containerMap[storedItemId] || 0);
    const safeCurrent = Number.isFinite(current) && current > 0 ? current : 0;

    containerMap[storedItemId] = 0;
    saveGameState(gameState);

    return safeCurrent;
};
