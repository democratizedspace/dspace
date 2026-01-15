import items from '../pages/inventory/json/items/index.js';
import { db, ENTITY_TYPES } from './customcontent.js';
import { isBrowser } from './ssr.js';

const builtInItemMap = new Map(items.map((item) => [String(item.id), item]));
const itemCache = new Map();
const rawItemCache = new Map();
const pendingFetches = new Map();
const objectUrlCache = new Map();

function normalizeId(id) {
    if (typeof id === 'string' || typeof id === 'number') {
        return String(id);
    }
    return null;
}

function isBlobLike(value) {
    if (!value) {
        return false;
    }

    if (typeof Blob !== 'undefined' && value instanceof Blob) {
        return true;
    }

    return (
        typeof value === 'object' &&
        typeof value.arrayBuffer === 'function' &&
        typeof value.type === 'string'
    );
}

function getOrCreateObjectUrl(id, blob) {
    if (!isBrowser || !blob) {
        return null;
    }

    const key = normalizeId(id);
    if (!key) {
        return null;
    }

    const cached = objectUrlCache.get(key);
    if (cached && cached.blob === blob) {
        return cached.url;
    }

    if (cached) {
        URL.revokeObjectURL(cached.url);
    }

    const url = URL.createObjectURL(blob);
    objectUrlCache.set(key, { url, blob, refCount: 0 });
    return url;
}

function resolveImage(item, id) {
    if (!item) {
        return { url: null, type: 'none' };
    }

    if (typeof item.image === 'string' && item.image.trim().length > 0) {
        return { url: item.image, type: 'string' };
    }

    if (typeof item.imageBlob === 'string' && item.imageBlob.trim().length > 0) {
        return { url: item.imageBlob, type: 'string' };
    }

    const blob =
        (isBlobLike(item.image) ? item.image : null) ||
        (isBlobLike(item.imageBlob) ? item.imageBlob : null);

    if (blob) {
        return { url: getOrCreateObjectUrl(id, blob), type: 'objectUrl' };
    }

    return { url: null, type: 'none' };
}

function normalizeItem(item, resolvedImage) {
    return {
        id: item.id,
        name: item.name || 'Unnamed item',
        description: item.description || '',
        image: resolvedImage.url,
        imageType: resolvedImage.type,
    };
}

function getCachedItem(id) {
    const cached = itemCache.get(id) ?? null;

    if (cached?.imageType === 'objectUrl' && !objectUrlCache.has(id)) {
        const raw = rawItemCache.get(id);
        if (raw) {
            const resolvedImage = resolveImage(raw, id);
            const refreshed = { ...cached, image: resolvedImage.url };
            itemCache.set(id, refreshed);
            return refreshed;
        }
    }

    return cached;
}

function setCacheItem(id, rawItem) {
    const resolvedImage = resolveImage(rawItem, id);
    const normalized = normalizeItem(rawItem, resolvedImage);

    itemCache.set(id, normalized);
    rawItemCache.set(id, rawItem);

    return normalized;
}

export async function getItemById(id) {
    const key = normalizeId(id);
    if (!key) {
        return null;
    }

    const cached = getCachedItem(key);
    if (cached) {
        return cached;
    }

    const builtInItem = builtInItemMap.get(key);
    if (builtInItem) {
        return setCacheItem(key, builtInItem);
    }

    if (!isBrowser) {
        return null;
    }

    const pending = pendingFetches.get(key);
    if (pending) {
        return pending;
    }

    const fetchPromise = db
        .get(ENTITY_TYPES.ITEM, id)
        .then((item) => {
            if (!item) {
                return null;
            }
            return setCacheItem(key, item);
        })
        .catch(() => null)
        .finally(() => {
            pendingFetches.delete(key);
        });

    pendingFetches.set(key, fetchPromise);
    return fetchPromise;
}

export async function getItemMap(ids = []) {
    const uniqueIds = Array.from(new Set(ids.map((id) => normalizeId(id)).filter(Boolean)));

    if (uniqueIds.length === 0) {
        return new Map();
    }

    const entries = await Promise.all(
        uniqueIds.map(async (id) => {
            const item = await getItemById(id);
            return [id, item];
        })
    );

    return new Map(entries.filter(([, item]) => Boolean(item)));
}

export function retainItemImages(ids = []) {
    if (!isBrowser) {
        return;
    }

    ids.forEach((id) => {
        const key = normalizeId(id);
        if (!key) {
            return;
        }
        const entry = objectUrlCache.get(key);
        if (entry) {
            entry.refCount += 1;
        }
    });
}

export function releaseItemImages(ids = []) {
    if (!isBrowser) {
        return;
    }

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
            URL.revokeObjectURL(entry.url);
            objectUrlCache.delete(key);
        }
    });
}

export function resetItemResolverCache() {
    itemCache.clear();
    rawItemCache.clear();
    pendingFetches.clear();
    if (isBrowser) {
        objectUrlCache.forEach((entry) => URL.revokeObjectURL(entry.url));
    }
    objectUrlCache.clear();
}

export function getBuiltInItem(id) {
    const key = normalizeId(id);
    if (!key) {
        return null;
    }
    return builtInItemMap.get(key) ?? null;
}
