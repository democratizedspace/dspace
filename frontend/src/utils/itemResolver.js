import items from '../pages/inventory/json/items';
import { db, ENTITY_TYPES } from './customcontent.js';
import { isBrowser } from './ssr.js';

const builtInItemsById = new Map(items.map((item) => [String(item.id), item]));
const itemCache = new Map();
const pendingRequests = new Map();
const objectUrlCache = new Map();

const normalizeId = (id) => (typeof id === 'string' || typeof id === 'number' ? String(id) : '');

const ensureObjectUrl = (id, blob) => {
    if (!isBrowser || !blob || typeof URL?.createObjectURL !== 'function') {
        return null;
    }

    const key = normalizeId(id);
    if (!key) {
        return null;
    }

    let entry = objectUrlCache.get(key);
    if (!entry) {
        entry = { url: URL.createObjectURL(blob), refs: 0 };
        objectUrlCache.set(key, entry);
    }

    return entry.url;
};

const resolveImageSource = (item) => {
    if (!item) {
        return { image: null, imageSource: 'missing' };
    }

    if (typeof item.image === 'string' && item.image.trim()) {
        return { image: item.image, imageSource: 'direct' };
    }

    const blob = item.image instanceof Blob ? item.image : item.imageBlob;
    if (blob) {
        const url = ensureObjectUrl(item.id, blob);
        return {
            image: url,
            imageSource: url ? 'blob' : 'missing',
        };
    }

    return { image: null, imageSource: 'missing' };
};

const normalizeItem = (item) => {
    const { image, imageSource } = resolveImageSource(item);
    return {
        id: item.id,
        name: item.name ?? String(item.id ?? ''),
        description: item.description ?? '',
        image,
        imageBlob: item.imageBlob ?? (item.image instanceof Blob ? item.image : null),
        imageSource,
    };
};

const retainItemImage = (id) => {
    const key = normalizeId(id);
    if (!key) {
        return;
    }

    const cached = itemCache.get(key);
    if (!cached || cached.imageSource !== 'blob') {
        return;
    }

    if (!cached.image && cached.imageBlob) {
        cached.image = ensureObjectUrl(key, cached.imageBlob);
    }

    const entry = objectUrlCache.get(key);
    if (entry) {
        entry.refs += 1;
    }
};

export const releaseItemImageUrls = (ids = []) => {
    ids.forEach((id) => {
        const key = normalizeId(id);
        if (!key) {
            return;
        }

        const entry = objectUrlCache.get(key);
        if (!entry) {
            return;
        }

        entry.refs -= 1;
        if (entry.refs <= 0) {
            if (typeof URL?.revokeObjectURL === 'function') {
                URL.revokeObjectURL(entry.url);
            }
            objectUrlCache.delete(key);

            const cached = itemCache.get(key);
            if (cached?.imageSource === 'blob') {
                cached.image = null;
            }
        }
    });
};

export const resetItemResolverCache = () => {
    objectUrlCache.forEach((entry) => {
        if (typeof URL?.revokeObjectURL === 'function') {
            URL.revokeObjectURL(entry.url);
        }
    });
    objectUrlCache.clear();
    itemCache.clear();
    pendingRequests.clear();
};

export const getItemById = async (id, { trackUsage = true } = {}) => {
    const key = normalizeId(id);
    if (!key) {
        return null;
    }

    if (itemCache.has(key)) {
        const cached = itemCache.get(key);
        if (cached && trackUsage) {
            retainItemImage(key);
        }
        return cached ?? null;
    }

    const builtInItem = builtInItemsById.get(key);
    if (builtInItem) {
        const normalized = normalizeItem(builtInItem);
        itemCache.set(key, normalized);
        return normalized;
    }

    if (!isBrowser) {
        return null;
    }

    let pending = pendingRequests.get(key);
    if (!pending) {
        pending = db
            .get(ENTITY_TYPES.ITEM, id)
            .then((item) => {
                if (!item) {
                    return null;
                }
                const normalized = normalizeItem(item);
                itemCache.set(key, normalized);
                return normalized;
            })
            .catch(() => null)
            .finally(() => {
                pendingRequests.delete(key);
            });
        pendingRequests.set(key, pending);
    }

    const resolved = await pending;
    if (resolved && trackUsage) {
        retainItemImage(key);
    }
    return resolved ?? null;
};

export const getItemMap = async (ids = [], { trackUsage = true } = {}) => {
    const uniqueIds = Array.from(
        new Set(ids.map((id) => normalizeId(id)).filter((id) => id))
    );

    const entries = await Promise.all(uniqueIds.map((id) => getItemById(id, { trackUsage })));
    const map = new Map();
    entries.forEach((item, index) => {
        if (item) {
            map.set(uniqueIds[index], item);
        }
    });
    return map;
};
