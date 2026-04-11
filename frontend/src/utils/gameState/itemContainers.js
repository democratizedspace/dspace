import { loadGameState, saveGameState } from './common.js';
import items from '../../pages/inventory/json/items';
import { getCachedMergedItemCatalog, getMergedItemCatalog } from '../../utils/itemCatalog.js';
import { isBrowser } from '../../utils/ssr.js';

let refreshInFlight = null;

const buildItemMap = (catalog = []) => new Map(catalog.map((item) => [item.id, item]));

const getItemMap = () => {
    const mergedCatalog = getCachedMergedItemCatalog();
    if (Array.isArray(mergedCatalog) && mergedCatalog.length > 0) {
        return buildItemMap(mergedCatalog);
    }

    return buildItemMap(items);
};

const refreshMergedItemCatalog = () => {
    if (!isBrowser || refreshInFlight) {
        return;
    }

    refreshInFlight = getMergedItemCatalog().finally(() => {
        refreshInFlight = null;
    });
};

const isValidId = (value) => typeof value === 'string' && value.trim().length > 0;

const normalizePositiveCount = (count) => {
    const parsed = Number(count);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 0;
    }
    return parsed;
};

const getContainerItem = (containerItemId) => getItemMap().get(containerItemId);

const getAllowedStoredItemIds = (containerItemId) => {
    if (!isValidId(containerItemId)) {
        return [];
    }

    const containerItem = getContainerItem(containerItemId);
    if (
        !containerItem ||
        typeof containerItem.itemCounts !== 'object' ||
        !containerItem.itemCounts
    ) {
        return [];
    }

    return Object.keys(containerItem.itemCounts);
};

const ensureContainerMap = (gameState, containerItemId) => {
    if (!gameState.itemContainerCounts || typeof gameState.itemContainerCounts !== 'object') {
        gameState.itemContainerCounts = {};
    }

    const containerMap = gameState.itemContainerCounts[containerItemId];
    if (!containerMap || typeof containerMap !== 'object') {
        gameState.itemContainerCounts[containerItemId] = {};
    }

    return gameState.itemContainerCounts[containerItemId];
};

export const canStoreItemInContainer = (containerItemId, storedItemId) => {
    refreshMergedItemCatalog();

    if (!isValidId(containerItemId) || !isValidId(storedItemId)) {
        return false;
    }

    const containerItem = getContainerItem(containerItemId);
    if (!containerItem) {
        return false;
    }

    return getAllowedStoredItemIds(containerItemId).includes(storedItemId);
};

export const getStateStoredItemCounts = (gameState, containerItemId) => {
    refreshMergedItemCatalog();

    if (!gameState || typeof gameState !== 'object' || !isValidId(containerItemId)) {
        return {};
    }

    const containerMap = gameState.itemContainerCounts?.[containerItemId] ?? {};
    const allowedIds = getAllowedStoredItemIds(containerItemId);

    return allowedIds.reduce((acc, storedItemId) => {
        acc[storedItemId] = Number(containerMap[storedItemId] ?? 0);
        return acc;
    }, {});
};

export const getStoredItemCounts = (containerItemId) => {
    const gameState = loadGameState();
    return getStateStoredItemCounts(gameState, containerItemId);
};

const getStateStoredItemCount = (gameState, containerItemId, storedItemId) => {
    if (!gameState || typeof gameState !== 'object') {
        return 0;
    }

    if (!canStoreItemInContainer(containerItemId, storedItemId)) {
        return 0;
    }

    const containerMap = gameState.itemContainerCounts?.[containerItemId] ?? {};
    return Math.max(0, Number(containerMap[storedItemId] ?? 0));
};

export const getStoredItemCount = (containerItemId, storedItemId) => {
    const gameState = loadGameState();
    return getStateStoredItemCount(gameState, containerItemId, storedItemId);
};

export const addStoredItemsToState = (gameState, containerItemId, storedItemId, delta) => {
    const safeDelta = normalizePositiveCount(delta);
    if (!canStoreItemInContainer(containerItemId, storedItemId) || safeDelta === 0) {
        return false;
    }

    const containerMap = ensureContainerMap(gameState, containerItemId);
    containerMap[storedItemId] =
        getStateStoredItemCount(gameState, containerItemId, storedItemId) + safeDelta;
    return true;
};

export const addStoredItems = (containerItemId, storedItemId, delta) => {
    const gameState = loadGameState();
    const changed = addStoredItemsToState(gameState, containerItemId, storedItemId, delta);
    if (changed) {
        saveGameState(gameState);
    }
    return changed;
};

export const removeStoredItemsFromState = (gameState, containerItemId, storedItemId, delta) => {
    const safeDelta = normalizePositiveCount(delta);
    if (!canStoreItemInContainer(containerItemId, storedItemId) || safeDelta === 0) {
        return 0;
    }

    const containerMap = ensureContainerMap(gameState, containerItemId);
    const currentCount = getStateStoredItemCount(gameState, containerItemId, storedItemId);
    const removed = Math.min(currentCount, safeDelta);

    containerMap[storedItemId] = currentCount - removed;
    return removed;
};

export const removeStoredItems = (containerItemId, storedItemId, delta) => {
    const gameState = loadGameState();
    const removed = removeStoredItemsFromState(gameState, containerItemId, storedItemId, delta);
    if (removed > 0) {
        saveGameState(gameState);
    }
    return removed;
};

export const removeAllStoredItemsFromState = (gameState, containerItemId, storedItemId) => {
    if (!canStoreItemInContainer(containerItemId, storedItemId)) {
        return 0;
    }

    const containerMap = ensureContainerMap(gameState, containerItemId);
    const currentCount = getStateStoredItemCount(gameState, containerItemId, storedItemId);
    containerMap[storedItemId] = 0;
    return currentCount;
};

export const removeAllStoredItems = (containerItemId, storedItemId) => {
    const gameState = loadGameState();
    const removed = removeAllStoredItemsFromState(gameState, containerItemId, storedItemId);
    if (removed > 0) {
        saveGameState(gameState);
    }
    return removed;
};
