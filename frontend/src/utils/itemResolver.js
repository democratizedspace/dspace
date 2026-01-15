import items from '../pages/inventory/json/items';
import { db, ENTITY_TYPES } from './customcontent.js';
import { isBrowser } from './ssr.js';

const builtInItems = new Map(items.map((item) => [String(item.id), item]));
const itemCache = new Map();
const pendingFetches = new Map();
const imageUrlCache = new Map();

const FALLBACK_NAME = 'Unknown item';
const FALLBACK_DESCRIPTION = 'Item details unavailable.';
const FALLBACK_IMAGE = '/favicon.ico';

function normalizeId(id) {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : String(id ?? '');
}

function normalizeItem(rawItem, fallbackId) {
    if (!rawItem) {
        return null;
    }

    const id = normalizeId(rawItem.id ?? fallbackId);

    return {
        id,
        name: rawItem.name?.trim() || FALLBACK_NAME,
        description: rawItem.description ?? '',
        image: rawItem.image ?? null,
        imageBlob: rawItem.imageBlob ?? null,
        custom: rawItem.custom ?? false,
    };
}

function releaseObjectUrl(id) {
    const entry = imageUrlCache.get(id);
    if (!entry) {
        return;
    }

    entry.count -= 1;
    if (entry.count <= 0) {
        URL.revokeObjectURL(entry.url);
        imageUrlCache.delete(id);
    }
}

function resolveImage(item) {
    if (!item) {
        return { image: null, releaseImage: null };
    }

    if (typeof item.image === 'string' && item.image.trim().length > 0) {
        return { image: item.image, releaseImage: null };
    }

    if (!isBrowser) {
        return { image: null, releaseImage: null };
    }

    const blob =
        item.imageBlob instanceof Blob
            ? item.imageBlob
            : item.image instanceof Blob
              ? item.image
              : null;

    if (!blob) {
        return { image: null, releaseImage: null };
    }

    const cached = imageUrlCache.get(item.id);
    if (cached && cached.blob === blob) {
        cached.count += 1;
        return {
            image: cached.url,
            releaseImage: () => releaseObjectUrl(item.id),
        };
    }

    if (cached) {
        URL.revokeObjectURL(cached.url);
    }

    const url = URL.createObjectURL(blob);
    imageUrlCache.set(item.id, { url, blob, count: 1 });

    return {
        image: url,
        releaseImage: () => releaseObjectUrl(item.id),
    };
}

async function fetchItem(id) {
    const key = normalizeId(id);

    if (itemCache.has(key)) {
        return itemCache.get(key);
    }

    const builtIn = builtInItems.get(key);
    if (builtIn) {
        const normalized = normalizeItem(builtIn, key);
        itemCache.set(key, normalized);
        return normalized;
    }

    if (!isBrowser) {
        itemCache.set(key, null);
        return null;
    }

    if (pendingFetches.has(key)) {
        return pendingFetches.get(key);
    }

    const fetchPromise = db
        .get(ENTITY_TYPES.ITEM, key)
        .then((item) => {
            const normalized = normalizeItem(item, key);
            itemCache.set(key, normalized);
            return normalized;
        })
        .catch(() => {
            itemCache.set(key, null);
            return null;
        })
        .finally(() => {
            pendingFetches.delete(key);
        });

    pendingFetches.set(key, fetchPromise);
    return fetchPromise;
}

export async function getItemById(id) {
    const key = normalizeId(id);
    const item = await fetchItem(key);

    if (!item) {
        return null;
    }

    const { image, releaseImage } = resolveImage(item);

    return {
        ...item,
        image: image ?? FALLBACK_IMAGE,
        releaseImage,
    };
}

export async function getItemsByIds(ids = []) {
    const results = [];

    for (const id of ids) {
        const resolved = await getItemById(id);
        results.push(resolved);
    }

    return results;
}

export async function getItemMap(ids = []) {
    const map = new Map();

    for (const id of ids) {
        const key = normalizeId(id);
        const resolved = await getItemById(key);

        if (resolved) {
            map.set(key, resolved);
            continue;
        }

        map.set(key, {
            id: key,
            name: FALLBACK_NAME,
            description: FALLBACK_DESCRIPTION,
            image: FALLBACK_IMAGE,
            missing: true,
            releaseImage: null,
        });
    }

    return map;
}

export function clearItemResolverCache() {
    itemCache.clear();
    pendingFetches.clear();

    if (!isBrowser) {
        return;
    }

    for (const entry of imageUrlCache.values()) {
        URL.revokeObjectURL(entry.url);
    }

    imageUrlCache.clear();
}
