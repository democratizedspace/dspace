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
    if (!containerItem || typeof containerItem.itemCounts !== 'object' || !containerItem.itemCounts) {
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
        // Allow custom container definitions that may not be loaded yet from IndexedDB.
        return true;
    }

    return getAllowedStoredItemIds(containerItemId).includes(storedItemId);
};

export const getStoredItemCounts = (containerItemId) => {
    refreshMergedItemCatalog();

    if (!isValidId(containerItemId)) {
        return {};
    }

    const gameState = loadGameState();
    const containerMap = gameState.itemContainerCounts?.[containerItemId] ?? {};
    const allowedIds = new Set(getAllowedStoredItemIds(containerItemId));

    Object.keys(containerMap).forEach((storedItemId) => {
        if (isValidId(storedItemId)) {
            allowedIds.add(storedItemId);
        }
    });

    return Array.from(allowedIds).reduce((acc, storedItemId) => {
        acc[storedItemId] = Number(containerMap[storedItemId] ?? 0);
        return acc;
    }, {});
};

export const getStoredItemCount = (containerItemId, storedItemId) => {
    if (!canStoreItemInContainer(containerItemId, storedItemId)) {
        return 0;
    }

    const gameState = loadGameState();
    const containerMap = gameState.itemContainerCounts?.[containerItemId] ?? {};
    return Math.max(0, Number(containerMap[storedItemId] ?? 0));
};

export const addStoredItems = (containerItemId, storedItemId, delta) => {
    const safeDelta = normalizePositiveCount(delta);
    if (!canStoreItemInContainer(containerItemId, storedItemId) || safeDelta === 0) {
        return false;
    }

    const gameState = loadGameState();
    const containerMap = ensureContainerMap(gameState, containerItemId);
    containerMap[storedItemId] = Math.max(0, Number(containerMap[storedItemId] ?? 0)) + safeDelta;
    saveGameState(gameState);
    return true;
};

export const removeStoredItems = (containerItemId, storedItemId, delta) => {
    const safeDelta = normalizePositiveCount(delta);
    if (!canStoreItemInContainer(containerItemId, storedItemId) || safeDelta === 0) {
        return 0;
    }

    const gameState = loadGameState();
    const containerMap = ensureContainerMap(gameState, containerItemId);
    const currentCount = Math.max(0, Number(containerMap[storedItemId] ?? 0));
    const removed = Math.min(currentCount, safeDelta);

    containerMap[storedItemId] = currentCount - removed;
    saveGameState(gameState);
    return removed;
};

export const removeAllStoredItems = (containerItemId, storedItemId) => {
    if (!canStoreItemInContainer(containerItemId, storedItemId)) {
        return 0;
    }

    const gameState = loadGameState();
    const containerMap = ensureContainerMap(gameState, containerItemId);
    const currentCount = Math.max(0, Number(containerMap[storedItemId] ?? 0));
    containerMap[storedItemId] = 0;
    saveGameState(gameState);
    return currentCount;
};
