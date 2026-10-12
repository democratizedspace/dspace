import builtInProcesses from '../generated/processes.json';
import builtInItems from '../pages/inventory/json/items/index.js';
import { listBuiltInQuestIds } from './builtInQuests.js';
// Pure import boundary: no browser storage, rendering, or network dependencies.
export const IMPORT_LIMITS = Object.freeze({
    transportBytes: 24 * 1024 * 1024,
    jsonBytes: 16 * 1024 * 1024,
    depth: 64,
    nodes: 100000,
    keys: 256,
    entries: 10000,
    entities: 2000,
    images: 2000,
    stringBytes: 64 * 1024,
    idBytes: 256,
    urlBytes: 2048,
    imageBytes: 2 * 1024 * 1024,
    totalImageBytes: 8 * 1024 * 1024,
    pixels: 4000000,
    totalPixels: 16000000,
});
export class ImportPreparationError extends Error {
    constructor(code, path = '$') {
        super(`Invalid backup data: ${code}`);
        this.name = 'ImportPreparationError';
        this.code = code;
        // Paths contain schema names/indices only, never attacker-controlled keys.
        this.fields = Object.freeze([{ path, code }]);
    }
}
export const failImport = (code, path) => {
    throw new ImportPreparationError(code, path);
};
const utf8 = new TextEncoder();
const bytes = (s) => utf8.encode(s).length;
const record = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const mapFields = new Set([
    'inventory',
    'quests',
    'processes',
    'itemContainerCounts',
    'itemCounts',
]);
const badKeys = new Set(['__proto__', 'prototype', 'constructor']);
const cap = (n, max, code) => {
    if (n > max) failImport(code);
};

export function decodeImportBase64(value, maxBytes) {
    const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
    if (
        value.length % 4 ||
        /[^A-Za-z0-9+/=]/.test(value) ||
        value.slice(0, value.length - padding).includes('=')
    )
        failImport('base64');
    const size = (value.length / 4) * 3 - (value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0);
    cap(size, maxBytes, 'decoded-bytes');
    let binary;
    try {
        binary = atob(value);
    } catch {
        failImport('base64');
    }
    if (btoa(binary) !== value) failImport('base64');
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

// Token pass runs before JSON.parse allocates an object graph. Recursion is capped first.
export function parseImportJSON(text, limits = IMPORT_LIMITS) {
    cap(text.length, limits.jsonBytes, 'json-bytes');
    cap(bytes(text), limits.jsonBytes, 'json-bytes');
    let i = 0,
        nodes = 0;
    const ws = () => {
        while (/[\x20\t\r\n]/.test(text[i] || 'x')) i++;
    };
    const str = () => {
        const start = i++;
        while (i < text.length) {
            const c = text[i++];
            if (c === '\\') {
                i++;
                continue;
            }
            if (c === '"') {
                try {
                    return JSON.parse(text.slice(start, i));
                } catch {
                    failImport('json');
                }
            }
        }
        failImport('json');
    };
    const value = (depth, field = '') => {
        cap(depth, limits.depth, 'depth');
        cap(++nodes, limits.nodes, 'nodes');
        ws();
        const c = text[i];
        if (c === '{' || c === '[') {
            const object = c === '{',
                end = object ? '}' : ']';
            i++;
            ws();
            const keys = new Set();
            let count = 0;
            if (text[i] === end) {
                i++;
                return;
            }
            while (i < text.length) {
                cap(
                    ++count,
                    object && !mapFields.has(field) ? limits.keys : limits.entries,
                    object ? 'keys' : 'entries'
                );
                ws();
                let fieldName = '';
                if (object) {
                    if (text[i] !== '"') failImport('json');
                    const key = str();
                    fieldName = key;
                    if (badKeys.has(key)) failImport('dangerous-key');
                    if (keys.has(key)) failImport('duplicate-key');
                    cap(bytes(key), limits.stringBytes, 'string-bytes');
                    keys.add(key);
                    ws();
                    if (text[i++] !== ':') failImport('json');
                }
                value(depth + 1, fieldName);
                ws();
                if (text[i] === end) {
                    i++;
                    return;
                }
                if (text[i++] !== ',') failImport('json');
            }
            failImport('json');
        }
        if (c === '"') {
            str();
            return;
        }
        const start = i;
        while (i < text.length && !/[\s,}\]]/.test(text[i])) i++;
        if (start === i) failImport('json');
    };
    value(1);
    ws();
    if (i !== text.length) failImport('json');
    try {
        return JSON.parse(text);
    } catch {
        failImport('json');
    }
}

function jsonStringSize(value) {
    let size = 2;
    for (let i = 0; i < value.length; i++) {
        const code = value.charCodeAt(i);
        if (code === 34 || code === 92) size += 2;
        else if (code < 32) size += [8, 9, 10, 12, 13].includes(code) ? 2 : 6;
        else if (code < 128) size++;
        else if (code < 2048) size += 2;
        else if (
            code >= 0xd800 &&
            code <= 0xdbff &&
            value.charCodeAt(i + 1) >= 0xdc00 &&
            value.charCodeAt(i + 1) <= 0xdfff
        ) {
            size += 4;
            i++;
        } else if (code >= 0xd800 && code <= 0xdfff) size += 6;
        else size += 3;
    }
    return size;
}
// Keep schema positions bounded; never accumulate untrusted property-name paths.
function childImagePosition(position, key, array) {
    if (array) return position === 'entities' ? 'entity' : position === 'images' ? 'image' : null;
    if (position === 'root' && key === 'customContent') return 'content';
    if (position === 'root' || position === 'content') {
        if (key === 'items' || key === 'processes' || key === 'quests') return 'entities';
        if (key === 'images') return 'images';
    }
    if ((position === 'entity' && key === 'image') || (position === 'image' && key === 'dataUrl'))
        return 'data';
    return null;
}
function inspectGraph(root, limits) {
    const stack = [[root, 1, '', 'root']],
        seen = new Set();
    let nodes = 0,
        jsonBytes = 0;
    const charge = (size) => {
        jsonBytes += size;
        cap(jsonBytes, limits.jsonBytes, 'json-bytes');
    };
    while (stack.length) {
        const [v, depth, key, position] = stack.pop();
        cap(++nodes, limits.nodes, 'nodes');
        cap(depth, limits.depth, 'depth');
        if (typeof v === 'string') {
            const imageData = position === 'data' && /^data:/i.test(v);
            cap(v.length, imageData ? limits.jsonBytes : limits.stringBytes, 'string-bytes');
            charge(jsonStringSize(v));
            cap(bytes(v), imageData ? limits.jsonBytes : limits.stringBytes, 'string-bytes');
        } else if (typeof v === 'number') {
            if (!Number.isFinite(v)) failImport('number');
            charge(String(v).length);
        } else if (v && typeof v === 'object') {
            if (seen.has(v)) failImport('non-json');
            seen.add(v);
            if (
                !Array.isArray(v) &&
                Object.getPrototypeOf(v) !== Object.prototype &&
                Object.getPrototypeOf(v) !== null
            )
                failImport('non-json');
            if (Array.isArray(v)) cap(v.length, limits.entries, 'entries');
            const keys = Reflect.ownKeys(v).filter((k) => !Array.isArray(v) || k !== 'length');
            if (keys.some((k) => typeof k !== 'string')) failImport('non-json');
            if (
                Array.isArray(v) &&
                (keys.length !== v.length || keys.some((k, i) => k !== String(i)))
            )
                failImport('non-json');
            cap(
                keys.length,
                Array.isArray(v) || mapFields.has(key) ? limits.entries : limits.keys,
                'entries'
            );
            charge(2 + Math.max(0, keys.length - 1));
            for (const k of keys) {
                cap(k.length, limits.stringBytes, 'string-bytes');
                if (!Array.isArray(v)) charge(jsonStringSize(k) + 1);
                if (badKeys.has(k)) failImport('dangerous-key');
                cap(bytes(k), limits.stringBytes, 'string-bytes');
                const descriptor = Object.getOwnPropertyDescriptor(v, k);
                if (!descriptor?.enumerable || !('value' in descriptor)) failImport('non-json');
                stack.push([
                    descriptor.value,
                    depth + 1,
                    k,
                    childImagePosition(position, k, Array.isArray(v)),
                ]);
            }
        } else if (v !== null && typeof v !== 'boolean') failImport('non-json');
        else charge(v === false ? 5 : 4);
    }
}
export function freezeImport(value) {
    const stack = [value];
    while (stack.length) {
        const v = stack.pop();
        if (v && typeof v === 'object' && !Object.isFrozen(v)) {
            stack.push(...Object.values(v));
            Object.freeze(v);
        }
    }
    return value;
}
export function canonicalImportURL(value, origin, route = false, limits = IMPORT_LIMITS) {
    if (
        typeof value !== 'string' ||
        !value ||
        Array.from(value).some(
            (c) => c.charCodeAt(0) <= 32 || c.charCodeAt(0) === 127 || c === '\\'
        ) ||
        value.startsWith('//')
    )
        failImport('url');
    cap(bytes(value), limits.urlBytes, 'url-bytes');
    let url;
    try {
        url = new URL(value, origin);
    } catch {
        failImport('url');
    }
    if (
        url.username ||
        url.password ||
        (route ? url.origin !== origin : url.protocol !== 'https:' && url.origin !== origin)
    )
        failImport('url');
    if (url.origin === origin) return url.pathname + url.search + url.hash;
    return url.href;
}

const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
    let crc = n;
    for (let i = 0; i < 8; i++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    return crc >>> 0;
});
const crc32 = (bytes) => {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
};
export function inspectRaster(data, limits, totals) {
    const match = /^data:([^;,]+)(?:;[^,;]+)*;base64,([A-Za-z0-9+/=]+)$/i.exec(data);
    if (!match) failImport('image-data');
    let mime = match[1].toLowerCase();
    if (mime === 'image/jpg') mime = 'image/jpeg';
    if (
        ![
            'image/png',
            'image/jpeg',
            'image/gif',
            'image/webp',
            'application/octet-stream',
        ].includes(mime)
    )
        failImport('image-type');
    const b = decodeImportBase64(match[2], limits.imageBytes);
    totals.bytes += b.length;
    cap(totals.bytes, limits.totalImageBytes, 'image-total-bytes');
    const s = (start, len) => String.fromCharCode(...b.slice(start, start + len));
    const u16 = (p) => (b[p] << 8) | b[p + 1];
    const le16 = (p) => b[p] | (b[p + 1] << 8);
    const u32 = (p) => new DataView(b.buffer).getUint32(p);
    const le32 = (p) => new DataView(b.buffer).getUint32(p, true);
    let kind,
        width = 0,
        height = 0;
    if (b.length >= 33 && s(0, 8) === '\x89PNG\r\n\x1a\n') {
        kind = 'image/png';
        let p = 8,
            header = false,
            image = false,
            end = false;
        while (p + 12 <= b.length) {
            const n = u32(p),
                type = s(p + 4, 4);
            if (p + 12 + n > b.length) failImport('image-truncated');
            if (crc32(b.subarray(p + 4, p + 8 + n)) !== u32(p + 8 + n)) failImport('image-crc');
            if (!header && type !== 'IHDR') failImport('image-header');
            if (type === 'IHDR') {
                if (header || n !== 13) failImport('image-header');
                header = true;
                width = u32(p + 8);
                height = u32(p + 12);
                const bitDepth = b[p + 16],
                    colorType = b[p + 17];
                if (
                    !{ 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] }[
                        colorType
                    ]?.includes(bitDepth) ||
                    b[p + 18] ||
                    b[p + 19] ||
                    b[p + 20] > 1
                )
                    failImport('image-header');
            }
            if (type === 'acTL' || type === 'fcTL' || type === 'fdAT')
                failImport('image-animation');
            if (type === 'IDAT') image = true;
            p += n + 12;
            if (type === 'IEND') {
                if (n || p !== b.length) failImport('image-header');
                end = true;
                break;
            }
        }
        if (!header || !image || !end) failImport('image-header');
    } else if (b.length >= 4 && b[0] === 255 && b[1] === 216) {
        kind = 'image/jpeg';
        let p = 2,
            scanning = false,
            hasScan = false,
            ended = false;
        while (p < b.length) {
            if (scanning) {
                while (p < b.length) {
                    if (b[p++] !== 255) continue;
                    while (b[p] === 255) p++;
                    if (b[p] === 0 || (b[p] >= 208 && b[p] <= 215)) {
                        p++;
                        continue;
                    }
                    p--;
                    break;
                }
                scanning = false;
            }
            if (b[p++] !== 255) failImport('image-header');
            while (b[p] === 255) p++;
            const marker = b[p++];
            if (marker === 217) {
                ended = p === b.length;
                break;
            }
            if (marker === 216 || p + 2 > b.length) failImport('image-header');
            const n = u16(p);
            if (n < 2 || p + n > b.length) failImport('image-truncated');
            if (marker === 226 && s(p + 2, 4) === 'MPF\0') failImport('image-animation');
            if ([192, 193, 194].includes(marker)) {
                if (n < 8 || width || n !== 8 + 3 * b[p + 7]) failImport('image-header');
                height = u16(p + 3);
                width = u16(p + 5);
            }
            if (marker === 218) {
                hasScan = true;
                scanning = true;
            }
            p += n;
        }
        if (!hasScan || !ended) failImport('image-header');
    } else if (b.length >= 14 && ['GIF87a', 'GIF89a'].includes(s(0, 6))) {
        kind = 'image/gif';
        width = le16(6);
        height = le16(8);
        let p = 13 + (b[10] & 128 ? 3 * 2 ** ((b[10] & 7) + 1) : 0),
            frames = 0,
            ended = false;
        const blocks = () => {
            while (p < b.length) {
                const n = b[p++];
                if (!n) return;
                p += n;
                if (p > b.length) failImport('image-truncated');
            }
            failImport('image-truncated');
        };
        while (p < b.length) {
            const type = b[p++];
            if (type === 59) {
                ended = p === b.length;
                break;
            }
            if (type === 33) {
                p++;
                blocks();
            } else if (type === 44) {
                if (++frames > 1) failImport('image-animation');
                if (p + 9 > b.length || le16(p + 4) > width || le16(p + 6) > height)
                    failImport('image-header');
                const packed = b[p + 8];
                p += 9 + (packed & 128 ? 3 * 2 ** ((packed & 7) + 1) : 0);
                p++;
                blocks();
            } else failImport('image-header');
        }
        if (!ended || frames !== 1) failImport('image-header');
    } else if (b.length >= 20 && s(0, 4) === 'RIFF' && s(8, 4) === 'WEBP') {
        kind = 'image/webp';
        if (le32(4) + 8 !== b.length) failImport('image-truncated');
        let p = 12,
            images = 0,
            canvasWidth = 0,
            canvasHeight = 0;
        while (p + 8 <= b.length) {
            const type = s(p, 4),
                n = le32(p + 4),
                q = p + 8;
            if (q + n > b.length) failImport('image-truncated');
            if (type === 'ANIM' || type === 'ANMF' || (type === 'VP8X' && b[q] & 2))
                failImport('image-animation');
            if (type === 'VP8X') {
                if (n !== 10) failImport('image-header');
                canvasWidth = 1 + b[q + 4] + (b[q + 5] << 8) + (b[q + 6] << 16);
                canvasHeight = 1 + b[q + 7] + (b[q + 8] << 8) + (b[q + 9] << 16);
            }
            if (type === 'VP8 ' && n >= 10 && s(q + 3, 3) === '\x9d\x01\x2a') {
                images++;
                width = le16(q + 6) & 16383;
                height = le16(q + 8) & 16383;
            }
            if (type === 'VP8L' && n >= 5 && b[q] === 47) {
                images++;
                const bits = le32(q + 1);
                width = (bits & 16383) + 1;
                height = ((bits >>> 14) & 16383) + 1;
            }
            p = q + n + (n % 2);
        }
        if (
            p !== b.length ||
            images !== 1 ||
            (canvasWidth && (canvasWidth !== width || canvasHeight !== height))
        )
            failImport('image-header');
    } else failImport('image-type');
    if (mime !== 'application/octet-stream' && mime !== kind) failImport('image-mime');
    if (!width || !height) failImport('image-dimensions');
    cap(width * height, limits.pixels, 'image-pixels');
    totals.pixels += width * height;
    cap(totals.pixels, limits.totalPixels, 'image-total-pixels');
    return `data:${kind};base64,${match[2]}`;
}

function normalizeCustom(raw, limits, origin) {
    if (!record(raw) || raw.schemaVersion !== 1) failImport('schema-version');
    const sections = {},
        ids = {},
        changes = {},
        missingSections = [];
    const totals = { bytes: 0, pixels: 0 };
    const id = (value) => {
        if ((typeof value !== 'string' && typeof value !== 'number') || !String(value).trim())
            failImport('id');
        if (typeof value === 'number' && !Number.isSafeInteger(value)) failImport('id');
        const normalized = String(value).trim();
        if (badKeys.has(normalized)) failImport('id');
        cap(bytes(normalized), limits.idBytes, 'id-bytes');
        return normalized;
    };
    for (const section of ['items', 'processes', 'quests', 'images']) {
        if (raw[section] === undefined) missingSections.push(section);
        sections[section] = raw[section] === undefined ? [] : raw[section];
        if (!Array.isArray(sections[section])) failImport('section-type');
        cap(sections[section].length, limits.entries, 'entries');
        ids[section] = new Map();
        changes[section] = [];
    }
    cap(
        sections.items.length + sections.processes.length + sections.quests.length,
        limits.entities,
        'entities'
    );
    cap(sections.images.length, limits.images, 'images');
    // Validate records and media against the original graph before the first deep clone.
    for (const section of ['items', 'processes', 'quests', 'images']) {
        for (const entity of sections[section]) {
            if (!record(entity)) failImport('record');
            const normalizedId = id(entity.id);
            if (ids[section].has(normalizedId)) failImport('duplicate-id');
            const change = { id: normalizedId };
            ids[section].set(normalizedId, change);
            changes[section].push(change);
            for (const field of [
                'name',
                'title',
                'description',
                'unit',
                'type',
                'price',
                'duration',
                'npc',
                'start',
            ]) {
                if (
                    entity[field] !== undefined &&
                    typeof entity[field] !== 'string' &&
                    !(typeof entity[field] === 'number' && ['price', 'duration'].includes(field))
                )
                    failImport('field-type');
                if (typeof entity[field] === 'string' && /[<>]/.test(entity[field]))
                    failImport('preview-markup');
            }
            if (entity.duration !== undefined) {
                if (typeof entity.duration === 'number') {
                    if (entity.duration < 0 || !Number.isFinite(entity.duration))
                        failImport('duration');
                } else {
                    if (!/^(?:[0-9]+(?:\.[0-9]+)?[dhms]\s*)+$/i.test(entity.duration))
                        failImport('duration');
                    let seconds = 0;
                    for (const part of entity.duration.matchAll(/([0-9]+(?:\.[0-9]+)?)([dhms])/gi))
                        seconds +=
                            Number(part[1]) *
                            { d: 86400, h: 3600, m: 60, s: 1 }[part[2].toLowerCase()];
                    if (!Number.isFinite(seconds)) failImport('duration');
                }
            }
            if (entity.route !== undefined)
                change.route = canonicalImportURL(entity.route, origin, true, limits);
            if (entity.image !== undefined) {
                if (typeof entity.image !== 'string') failImport('image-type');
                change.image = entity.image
                    ? /^data:/i.test(entity.image)
                        ? inspectRaster(entity.image, limits, totals)
                        : canonicalImportURL(entity.image, origin, false, limits)
                    : '';
            }
        }
    }
    for (let i = 0; i < sections.images.length; i++) {
        const image = sections.images[i],
            change = changes.images[i];
        const map =
            image.entityType === 'item'
                ? ids.items
                : image.entityType === 'quest'
                  ? ids.quests
                  : null;
        change.entityId = id(image.entityId);
        if (!map?.has(change.entityId)) failImport('image-reference');
        if (typeof image.dataUrl !== 'string') failImport('image-data');
        change.dataUrl = inspectRaster(image.dataUrl, limits, totals);
        map.get(change.entityId).image = change.dataUrl;
    }
    const itemIds = new Set([...builtInItems.map((item) => String(item.id)), ...ids.items.keys()]);
    const processIds = new Set([
        ...builtInProcesses.map((process) => String(process.id)),
        ...ids.processes.keys(),
    ]);
    const questIds = new Set([...listBuiltInQuestIds(), ...ids.quests.keys()]);
    for (let index = 0; index < sections.items.length; index++) {
        const counts = sections.items[index].itemCounts;
        if (counts === undefined) continue;
        if (!record(counts)) failImport('container-counts');
        const normalized = {};
        for (const [key, count] of Object.entries(counts)) {
            const itemId = id(key);
            if (!itemIds.has(itemId)) failImport('unresolved-reference');
            if (Object.hasOwn(normalized, itemId)) failImport('duplicate-id');
            if (typeof count !== 'number' || !Number.isFinite(count) || count < 0)
                failImport('container-counts');
            normalized[itemId] = count;
        }
        changes.items[index].itemCounts = normalized;
    }
    const itemCatalog = new Map([
        ...builtInItems.map((item) => [String(item.id), item]),
        ...sections.items.map((item, index) => [
            changes.items[index].id,
            { ...item, ...changes.items[index] },
        ]),
    ]);
    const containerReference = (value, itemId) => {
        const containerId = id(value);
        if (!itemCatalog.has(containerId) || !itemIds.has(itemId))
            failImport('unresolved-reference');
        const counts = itemCatalog.get(containerId).itemCounts;
        if (!record(counts) || !Object.hasOwn(counts, itemId)) failImport('container-reference');
        return containerId;
    };
    const links = (source, target, field, catalog, counted = false) => {
        if (source[field] === undefined) return;
        if (!Array.isArray(source[field])) failImport('reference-type');
        target[field] = source[field].map((link) => {
            if (
                counted &&
                (!record(link) ||
                    typeof link.count !== 'number' ||
                    !Number.isFinite(link.count) ||
                    link.count < 0)
            )
                failImport('reference-count');
            const linkedId = id(counted ? link.id : link);
            if (!catalog.has(linkedId)) failImport('unresolved-reference');
            if (!counted) return linkedId;
            const normalized = { ...link, id: linkedId };
            if (link.containerItemId !== undefined)
                normalized.containerItemId = containerReference(link.containerItemId, linkedId);
            return normalized;
        });
    };
    for (const section of ['items', 'processes', 'quests']) {
        for (let i = 0; i < sections[section].length; i++) {
            const entity = sections[section][i],
                change = changes[section][i];
            for (const field of [
                'requireItems',
                'consumeItems',
                'createItems',
                'requiresItems',
                'grantsItems',
            ])
                links(entity, change, field, itemIds, true);
            if (section === 'processes' && entity.itemCountOperations !== undefined) {
                if (!Array.isArray(entity.itemCountOperations)) failImport('item-count-operation');
                change.itemCountOperations = entity.itemCountOperations.map((operation) => {
                    if (
                        !record(operation) ||
                        !['deposit', 'withdraw', 'withdraw-all'].includes(operation.operation) ||
                        Object.keys(operation).some(
                            (key) =>
                                !['operation', 'containerItemId', 'itemId', 'count'].includes(key)
                        )
                    )
                        failImport('item-count-operation');
                    const itemId = id(operation.itemId);
                    const containerItemId = containerReference(operation.containerItemId, itemId);
                    if (operation.operation === 'withdraw-all') {
                        if (operation.count !== undefined) failImport('operation-count');
                    } else if (
                        typeof operation.count !== 'number' ||
                        !Number.isFinite(operation.count) ||
                        operation.count <= 0
                    )
                        failImport('operation-count');
                    return { ...operation, itemId, containerItemId };
                });
            }
            if (section === 'quests') links(entity, change, 'rewards', itemIds, true);
            links(entity, change, 'requiresQuests', questIds);
            links(entity, change, 'dependencies', itemIds);
            if (entity.dialogue !== undefined) {
                if (!Array.isArray(entity.dialogue)) failImport('dialogue');
                const nodeIds = new Set();
                for (const node of entity.dialogue) {
                    if (!record(node)) failImport('dialogue');
                    const nodeId = id(node.id);
                    if (nodeIds.has(nodeId)) failImport('duplicate-node-id');
                    nodeIds.add(nodeId);
                }
                if (entity.start !== undefined) {
                    change.start = id(entity.start);
                    if (!nodeIds.has(change.start)) failImport('unresolved-reference');
                }
                change.dialogue = entity.dialogue.map((node) => {
                    if (
                        node.text !== undefined &&
                        (typeof node.text !== 'string' || /[<>]/.test(node.text))
                    )
                        failImport('preview-markup');
                    if (node.options !== undefined && !Array.isArray(node.options))
                        failImport('dialogue');
                    const normalized = { ...node, id: id(node.id) };
                    if (node.options)
                        normalized.options = node.options.map((option) => {
                            if (
                                !record(option) ||
                                typeof option.text !== 'string' ||
                                /[<>]/.test(option.text)
                            )
                                failImport('preview-markup');
                            const next = { ...option };
                            if (option.type === 'process' || option.process !== undefined) {
                                next.process = id(option.process);
                                if (!processIds.has(next.process))
                                    failImport('unresolved-reference');
                            }
                            if (option.goto !== undefined) {
                                next.goto = id(option.goto);
                                if (next.goto !== 'finish' && !nodeIds.has(next.goto))
                                    failImport('unresolved-reference');
                            }
                            for (const field of ['requiresItems', 'grantsItems', 'consumeItems'])
                                links(option, next, field, itemIds, true);
                            links(option, next, 'requiresQuests', questIds);
                            return next;
                        });
                    return normalized;
                });
            }
        }
    }
    if (
        raw.counts !== undefined &&
        (!record(raw.counts) ||
            Object.values(raw.counts).some((n) => !Number.isSafeInteger(n) || n < 0))
    )
        failImport('counts');
    const next = structuredClone(raw);
    for (const section of ['items', 'processes', 'quests', 'images']) {
        next[section] ??= [];
        next[section].forEach((entity, index) => {
            Object.assign(entity, structuredClone(changes[section][index]));
            delete entity.imageBlob;
        });
    }
    next.counts = Object.fromEntries(
        ['items', 'processes', 'quests', 'images'].map((k) => [k, next[k].length])
    );
    next.missingSections = missingSections;
    return next;
}

export function prepareImport(
    input,
    { kind = 'game', origin = 'https://dspace.invalid', limits: overrides = {} } = {}
) {
    const limits = { ...IMPORT_LIMITS, ...overrides };
    let raw = input;
    if (typeof input === 'string') {
        cap(input.length, limits.transportBytes, 'transport-bytes');
        cap(bytes(input), limits.transportBytes, 'transport-bytes');
        let text = input.trim();
        if (!/^[{["\-0-9tfn]/.test(text)) {
            try {
                text = new TextDecoder('utf-8', { fatal: true }).decode(
                    decodeImportBase64(text, limits.jsonBytes)
                );
            } catch (error) {
                if (error instanceof ImportPreparationError) throw error;
                failImport('utf8');
            }
        }
        raw = parseImportJSON(text, limits);
    }
    inspectGraph(raw, limits);
    if (!record(raw)) failImport('root');
    // Graph inspection charges exact serialized bytes without invoking serialization hooks.
    if (kind === 'custom')
        return freezeImport({ customContent: normalizeCustom(raw, limits, origin) });
    if ('schemaVersion' in raw && raw.schemaVersion !== 1) failImport('schema-version');
    if ('schemaVersion' in raw && !('payload' in raw)) failImport('envelope-payload');
    const source = 'payload' in raw ? raw.payload : raw;
    if (!record(source)) failImport('root');
    for (const section of [
        'quests',
        'inventory',
        'processes',
        'itemContainerCounts',
        'settings',
        '_meta',
        'github',
        'openAI',
    ]) {
        if (source[section] !== undefined && !record(source[section])) failImport('section-type');
    }
    for (const count of Object.values(source.inventory || {}))
        if (typeof count !== 'number' || count < 0) failImport('inventory-count');
    for (const section of ['inventory', 'quests', 'processes', 'itemContainerCounts']) {
        for (const key of Object.keys(source[section] || {}))
            cap(bytes(key), limits.idBytes, 'id-bytes');
    }
    for (const counts of Object.values(source.itemContainerCounts || {})) {
        if (!record(counts)) failImport('container-counts');
        for (const [key, count] of Object.entries(counts)) {
            cap(bytes(key), limits.idBytes, 'id-bytes');
            if (typeof count !== 'number' || !Number.isFinite(count) || count < 0)
                failImport('container-counts');
        }
    }
    const customContent =
        raw.customContent === undefined
            ? undefined
            : normalizeCustom(raw.customContent, limits, origin);
    const game = structuredClone(source);
    delete game.customContent;
    // Credentials and epoch authority are never portable.
    delete game.github;
    delete game.openAI;
    if (game._meta) {
        delete game._meta.credentialEpochs;
        delete game._meta.clearIntents;
    }
    delete game.credentialEpochs;
    delete game.clearIntents;

    return freezeImport({ game, ...(customContent ? { customContent } : {}) });
}
export async function prepareImportFile(file, options = {}) {
    const limits = { ...IMPORT_LIMITS, ...options.limits };
    if (!file || typeof file.size !== 'number' || typeof file.text !== 'function')
        failImport('file');
    cap(file.size, limits.transportBytes, 'transport-bytes');
    return prepareImport(await file.text(), options);
}

// Used for ephemeral recovery only. Validate before recursive sanitization or cloning.
export function assertRecoveryBudget(value) {
    inspectGraph(value, IMPORT_LIMITS);
    cap(bytes(JSON.stringify(value)), IMPORT_LIMITS.jsonBytes, 'recovery-bytes');
}
