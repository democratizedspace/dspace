// Shared pure JSON budgets. Keep this module independent of browser catalogs/storage.
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
export const bytes = (s) => utf8.encode(s).length;
export const record = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const mapFields = new Set([
    'inventory',
    'quests',
    'processes',
    'itemContainerCounts',
    'itemCounts',
]);
export const badKeys = new Set(['__proto__', 'prototype', 'constructor']);
export const cap = (n, max, code) => {
    if (n > max) failImport(code);
};

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
export function inspectGraph(root, limits) {
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

export function assertBackupBudget(envelope, overrides = {}) {
    const limits = { ...IMPORT_LIMITS, ...overrides };
    inspectGraph(envelope, limits);
    const content = envelope.customContent;
    if (content !== undefined) {
        if (!record(content) || content.schemaVersion !== 1) failImport('schema-version');
        let entities = 0;
        for (const section of ['items', 'processes', 'quests', 'images']) {
            if (content[section] === undefined) continue;
            if (!Array.isArray(content[section])) failImport('section-type');
            if (section === 'images') cap(content[section].length, limits.images, 'images');
            else entities += content[section].length;
        }
        cap(entities, limits.entities, 'entities');
    }
}
