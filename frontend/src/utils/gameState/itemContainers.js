import { loadGameState, saveGameState } from './common.js';
import items from '../../pages/inventory/json/items';

const parseCount = (value) => {
    const parsed = Number.parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeItemCountMap = (value) => {
    if (!value || typeof value !== 'object') {
        return {};
    }

    return Object.entries(value).reduce((acc, [itemId, count]) => {
        const normalized = parseCount(count);
        if (normalized >= 0) {
            acc[itemId] = normalized;
        }
        return acc;
    }, {});
};

const buildContainerConfig = () =>
    new Map(
        (Array.isArray(items) ? items : [])
            .filter((item) => item?.itemCounts && typeof item.itemCounts === 'object')
            .map((item) => [item.id, normalizeItemCountMap(item.itemCounts)])
    );

const containerConfig = buildContainerConfig();

export const getContainerItemDefaults = (containerItemId) => ({
    ...(containerConfig.get(containerItemId) ?? {}),
});

export const canStoreItemInContainer = (containerItemId, storedItemId) =>
    Object.prototype.hasOwnProperty.call(getContainerItemDefaults(containerItemId), storedItemId);

const getStateContainerCounts = (gameState, containerItemId) => {
    const defaults = getContainerItemDefaults(containerItemId);
    const stateMap = normalizeItemCountMap(gameState?.inventoryItemCounts?.[containerItemId]);

    return Object.keys(defaults).reduce((acc, storedItemId) => {
        acc[storedItemId] = parseCount(stateMap[storedItemId] ?? defaults[storedItemId]);
        return acc;
    }, {});
};

const setStateContainerCounts = (gameState, containerItemId, counts) => {
    gameState.inventoryItemCounts = gameState.inventoryItemCounts ?? {};
    gameState.inventoryItemCounts[containerItemId] = counts;
};

export const getStoredItemCounts = (containerItemId) => {
    const gameState = loadGameState();
    return getStateContainerCounts(gameState, containerItemId);
};

export const getStoredItemCount = (containerItemId, storedItemId) => {
    const counts = getStoredItemCounts(containerItemId);
    return parseCount(counts[storedItemId]);
};

export const addStoredItems = (containerItemId, storedItemId, count) => {
    const delta = parseCount(count);
    if (delta <= 0 || !canStoreItemInContainer(containerItemId, storedItemId)) {
        return false;
    }

    const gameState = loadGameState();
    const counts = getStateContainerCounts(gameState, containerItemId);
    counts[storedItemId] = parseCount(counts[storedItemId]) + delta;
    setStateContainerCounts(gameState, containerItemId, counts);
    saveGameState(gameState);
    return true;
};

export const removeStoredItems = (containerItemId, storedItemId, count) => {
    if (!canStoreItemInContainer(containerItemId, storedItemId)) {
        return 0;
    }

    const requestedCount = parseCount(count);
    if (requestedCount <= 0) {
        return 0;
    }

    const gameState = loadGameState();
    const counts = getStateContainerCounts(gameState, containerItemId);
    const available = parseCount(counts[storedItemId]);
    const removed = Math.min(available, requestedCount);

    counts[storedItemId] = Math.max(0, available - removed);
    setStateContainerCounts(gameState, containerItemId, counts);
    saveGameState(gameState);
    return removed;
};

export const removeAllStoredItems = (containerItemId, storedItemId) => {
    const available = getStoredItemCount(containerItemId, storedItemId);
    if (available <= 0) {
        return 0;
    }

    return removeStoredItems(containerItemId, storedItemId, available);
};
