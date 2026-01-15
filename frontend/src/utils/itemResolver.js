import items from '../pages/inventory/json/items';
import { db } from './customcontent.js';
import { isBrowser } from './ssr.js';

const normalizeId = (id) => (typeof id === 'string' || typeof id === 'number' ? String(id) : null);

const builtInItemMap = new Map(
    items
        .map((item) => {
            const key = normalizeId(item.id);
            if (!key) {
                return null;
            }
            return [key, item];
        })
        .filter(Boolean)
);

const resolvedItemMap = new Map();
const pendingRequests = new Map();
const objectUrlCache = new Map();

const initializeResolvedItems = () => {
    resolvedItemMap.clear();
    builtInItemMap.forEach((item, key) => {
        resolvedItemMap.set(key, normalizeItem(item));
    });
};

const ensureObjectUrl = (id, blob) => {
    const key = normalizeId(id);
    if (!key || !isBrowser) {
        return null;
    }

    if (objectUrlCache.has(key)) {
        return objectUrlCache.get(key).url;
    }

    if (!blob || !(blob instanceof Blob)) {
        return null;
    }

    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
        return null;
    }

    const url = URL.createObjectURL(blob);
    objectUrlCache.set(key, { url, refCount: 0 });
    return url;
};

const normalizeItem = (item) => {
    if (!item) {
        return null;
    }
    const image =
        typeof item.image === 'string' && item.image.trim().length > 0
            ? item.image
            : ensureObjectUrl(item.id, item.imageBlob);

    return {
        id: item.id,
        name: item.name || 'Unnamed Item',
        description: item.description || '',
        image,
    };
};

initializeResolvedItems();

export const getCachedItemById = (id) => {
    const key = normalizeId(id);
    if (!key) {
        return null;
    }
    return resolvedItemMap.get(key) ?? null;
};

export const getCachedItemMap = (ids = []) => {
    const map = new Map();
    ids.forEach((id) => {
        const key = normalizeId(id);
        if (!key) {
            return;
        }
        const item = resolvedItemMap.get(key);
        if (item) {
            map.set(key, item);
        }
    });
    return map;
};

export const getItemById = async (id) => {
    const key = normalizeId(id);
    if (!key) {
        return null;
    }

    if (resolvedItemMap.has(key)) {
        return resolvedItemMap.get(key);
    }

    if (!isBrowser) {
        return null;
    }

    if (pendingRequests.has(key)) {
        return pendingRequests.get(key);
    }

    const request = db.items
        .get(id)
        .then((item) => {
            if (!item) {
                return null;
            }
            const normalized = normalizeItem(item);
            if (normalized) {
                resolvedItemMap.set(key, normalized);
            }
            return normalized;
        })
        .catch(() => null)
        .finally(() => {
            pendingRequests.delete(key);
        });

    pendingRequests.set(key, request);
    return request;
};

export const getItemMap = async (ids = []) => {
    const uniqueIds = new Map();
    ids.forEach((id) => {
        const key = normalizeId(id);
        if (!key || uniqueIds.has(key)) {
            return;
        }
        uniqueIds.set(key, id);
    });

    const entries = await Promise.all(
        Array.from(uniqueIds.entries()).map(async ([key, originalId]) => {
            const item = await getItemById(originalId);
            return [key, item];
        })
    );

    const map = new Map();
    entries.forEach(([id, item]) => {
        if (item) {
            map.set(id, item);
        }
    });

    return map;
};

export const retainItemImages = (ids = []) => {
    ids.forEach((id) => {
        const key = normalizeId(id);
        if (!key) {
            return;
        }
        const entry = objectUrlCache.get(key);
        if (!entry) {
            return;
        }
        entry.refCount += 1;
    });
};

export const releaseItemImages = (ids = []) => {
    ids.forEach((id) => {
        const key = normalizeId(id);
        if (!key) {
            return;
        }
        const entry = objectUrlCache.get(key);
        if (!entry) {
            return;
        }
        entry.refCount -= 1;
        if (entry.refCount <= 0) {
            if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
                URL.revokeObjectURL(entry.url);
            }
            objectUrlCache.delete(key);
        }
    });
};

export const resetItemResolverCache = () => {
    objectUrlCache.forEach((entry) => {
        if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
            URL.revokeObjectURL(entry.url);
        }
    });
    objectUrlCache.clear();
    pendingRequests.clear();
    initializeResolvedItems();
};
