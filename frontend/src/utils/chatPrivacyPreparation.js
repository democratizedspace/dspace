// Inert preparation only. No production caller, transport, consent or credential authority.
export const CHAT_PRIVACY_LIMITS = Object.freeze({
    latestBytes: 8192,
    messageBytes: 8192,
    totalBytes: 32768,
    messageCount: 16,
    policyBytes: 4096,
    playerBytes: 4096,
    customBytes: 4096,
    historyBytes: 8192,
    historyCount: 4,
    serializedBytes: 65536,
    categoryRecords: 32,
});

const groups = ['inventory', 'quests', 'processes', 'resources'];
const kinds = ['item', 'quest', 'process'];
const fields = ['title', 'description'];
const fail = (code) => {
    throw new Error(`chat-privacy:${code}`);
};
// Count without allocating an encoded copy. Callers can stop at a known capacity.
function bytes(value, limit = Infinity) {
    if (value.length > limit) return limit + 1;
    let size = 0;
    for (const character of value) {
        const point = character.codePointAt(0);
        size += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
        if (size > limit) return limit + 1;
    }
    return size;
}

function record(value) {
    if (
        !value ||
        typeof value !== 'object' ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(value))
    ) {
        fail('invalid-record');
    }
    return value;
}

// Read only explicit own data fields; ignored fields (including getters) are never evaluated.
function own(value, key, fallback = undefined) {
    const descriptor = Object.getOwnPropertyDescriptor(record(value), key);
    if (!descriptor) return fallback;
    if (!Object.hasOwn(descriptor, 'value')) fail('accessor');
    return descriptor.value;
}

function text(value, limit = Infinity, limitCode = 'text-limit') {
    if (typeof value !== 'string') fail('invalid-text');
    if (value.length > limit) fail(limitCode);
    if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)) {
        fail('invalid-text');
    }
    if (bytes(value, limit) > limit) fail(limitCode);
    return value;
}

function id(value) {
    if (!text(value, 256).length) fail('invalid-id');
    return value;
}

function list(value, limit = 10000) {
    if (!Array.isArray(value) || value.length > limit) fail('invalid-list');
    // Reject sparse arrays and accessors without executing them.
    return Array.from({ length: value.length }, (_, index) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !Object.hasOwn(descriptor, 'value')) fail('invalid-list');
        return descriptor.value;
    });
}

function identifiers(value) {
    const result = list(value, 256).map(id);
    if (new Set(result).size !== result.length) fail('duplicate-selection');
    return result;
}

function indexRows(value) {
    const result = new Map();
    for (const row of list(value)) {
        const key = id(own(row, 'id'));
        if (result.has(key)) fail('duplicate-id');
        result.set(key, row);
    }
    return result;
}

function freeze(value) {
    if (value && typeof value === 'object') {
        for (const child of Object.values(value)) freeze(child);
        Object.freeze(value);
    }
    return value;
}

/**
 * Prepare detached plain data from explicit inputs. The returned serialization is local JSON,
 * not an authenticated digest, consent grant, provider request or K069 wire representation.
 * Policy limits may only reduce the provisional defaults. Optional categories require selection.
 */
export function prepareChatPrivacyRequest(input, catalog, policy) {
    record(input);
    record(catalog);
    record(policy);
    const limits = { ...CHAT_PRIVACY_LIMITS };
    const overrides = own(policy, 'limits', {});
    for (const key of Object.keys(record(overrides))) {
        if (!Object.hasOwn(limits, key)) fail('unknown-limit');
        const value = own(overrides, key);
        if (!Number.isSafeInteger(value) || value < 0 || value > limits[key]) {
            fail('invalid-limit');
        }
        limits[key] = value;
    }
    const sourceLabels = own(input, 'labels');
    const labels = {
        provider: text(own(sourceLabels, 'provider'), 256),
        model: text(own(sourceLabels, 'model'), 256),
        route: text(own(sourceLabels, 'route'), 2048),
    };
    const policyId = text(own(policy, 'id'), 256);
    const requiredPolicy = text(own(policy, 'text'), limits.policyBytes, 'policy-limit');
    const latest = text(own(input, 'latestText'), limits.latestBytes, 'latest-limit');
    const selection = own(input, 'selection', {});
    record(selection);
    const omissions = [];
    const omit = (category, reason) => {
        const existing = omissions.find(
            (entry) => entry.category === category && entry.reason === reason
        );
        if (existing) existing.count += 1;
        else omissions.push({ category, reason, count: 1 });
    };
    const player = [];
    const custom = [];
    const history = [];
    const makeData = () => ({
        version: 1,
        policyId,
        labels,
        messages: [
            { category: 'policy', role: 'system', content: requiredPolicy },
            ...(player.length
                ? [{ category: 'player', role: 'user', content: JSON.stringify(player) }]
                : []),
            ...(custom.length
                ? [{ category: 'custom', role: 'user', content: JSON.stringify(custom) }]
                : []),
            ...history,
            { category: 'latest', role: 'user', content: latest },
        ],
    });
    const fits = () => {
        const data = makeData();
        const sizes = data.messages.map((message) => bytes(message.content));
        return (
            data.messages.length <= limits.messageCount &&
            sizes.every((size) => size <= limits.messageBytes) &&
            sizes.reduce((sum, size) => sum + size, 0) <= limits.totalBytes &&
            bytes(JSON.stringify(data)) <= limits.serializedBytes
        );
    };
    if (!fits()) fail('required-budget');

    const append = (category, rows, value) => {
        if (rows.length >= limits.categoryRecords) {
            omit(category, 'record-cap');
            return;
        }
        rows.push(value);
        if (bytes(JSON.stringify(rows)) > limits[`${category}Bytes`] || !fits()) {
            rows.pop();
            omit(category, 'budget');
        }
    };
    // Bound each selected string before copying it into JSON. Oversized optional records
    // are omitted whole; an omitted/count-capped field never needs full validation or copying.
    const optionalText = (value, category) => {
        if (typeof value !== 'string') fail('invalid-text');
        const capacity = Math.min(
            limits[`${category}Bytes`],
            limits.messageBytes,
            limits.totalBytes,
            limits.serializedBytes
        );
        if (bytes(value, capacity) > capacity) return null;
        return text(value);
    };

    const playerSelection = own(selection, 'player');
    if (playerSelection !== undefined && playerSelection !== false) {
        record(playerSelection);
        const source = own(input, 'player', {});
        for (const group of groups) {
            const selected = identifiers(own(playerSelection, group, []));
            if (!selected.length) continue;
            const builtIns = indexRows(own(catalog, group, []));
            const rows = indexRows(own(source, group, []));
            for (const key of selected) {
                if (!builtIns.has(key)) {
                    omit('player', 'unknown-id');
                    continue;
                }
                const row = rows.get(key);
                if (!row) {
                    omit('player', 'missing-id');
                    continue;
                }
                if (player.length >= limits.categoryRecords) {
                    omit('player', 'record-cap');
                    continue;
                }
                const title = optionalText(own(builtIns.get(key), 'title'), 'player');
                if (title === null) {
                    omit('player', 'budget');
                    continue;
                }
                const value = { group, id: key, title };
                if (group === 'quests') {
                    value.finished = own(row, 'finished');
                    if (typeof value.finished !== 'boolean') fail('invalid-status');
                } else if (group === 'processes') {
                    value.status = own(row, 'status');
                    if (!['running', 'paused'].includes(value.status)) fail('invalid-status');
                } else {
                    value.count = own(row, 'count');
                    if (
                        typeof value.count !== 'number' ||
                        !Number.isFinite(value.count) ||
                        value.count < 0
                    ) {
                        fail('invalid-count');
                    }
                }
                append('player', player, value);
            }
        }
    }

    const customSelection = own(selection, 'custom');
    if (customSelection !== undefined && customSelection !== false) {
        const chosen = list(customSelection, 256);
        const source = own(input, 'custom', {});
        const seen = new Set();
        const rowsByKind = new Map();
        for (const entry of chosen) {
            const kind = own(entry, 'kind');
            if (!kinds.includes(kind)) fail('invalid-kind');
            const key = id(own(entry, 'id'));
            const selectedFields = identifiers(own(entry, 'fields', []));
            if (selectedFields.some((field) => !fields.includes(field))) fail('invalid-field');
            const identity = JSON.stringify([kind, key]);
            if (seen.has(identity)) fail('duplicate-selection');
            seen.add(identity);
            if (!rowsByKind.has(kind)) rowsByKind.set(kind, indexRows(own(source, kind, [])));
            const row = rowsByKind.get(kind).get(key);
            if (!row) {
                omit('custom', 'missing-id');
                continue;
            }
            if (custom.length >= limits.categoryRecords) {
                omit('custom', 'record-cap');
                continue;
            }
            const value = { kind, id: key };
            // Fixed field order makes equivalent field selections serialize identically.
            for (const field of fields) {
                if (selectedFields.includes(field)) {
                    value[field] = optionalText(own(row, field), 'custom');
                    if (value[field] === null) break;
                }
            }
            if (Object.values(value).includes(null)) omit('custom', 'budget');
            else append('custom', custom, value);
        }
    }

    const historySelection = own(selection, 'history');
    if (historySelection !== undefined && historySelection !== false) {
        const selected = new Set(identifiers(historySelection));
        if (selected.size) {
            const rows = indexRows(own(input, 'history', []));
            for (const key of selected) if (!rows.has(key)) omit('history', 'missing-id');
            // Input array order is chronological; newest selected messages win bounded capacity.
            const candidates = [...rows].filter(([key]) => selected.has(key));
            let historyBytes = 0;
            for (let index = candidates.length - 1; index >= 0; index -= 1) {
                const [key, row] = candidates[index];
                if (history.length >= limits.historyCount) {
                    omit('history', 'record-cap');
                    continue;
                }
                const role = own(row, 'role');
                if (!['user', 'assistant'].includes(role)) fail('invalid-role');
                const content = optionalText(own(row, 'content'), 'history');
                if (content === null) {
                    omit('history', 'budget');
                    continue;
                }
                const size = bytes(content);
                history.unshift({ category: 'history', id: key, role, content });
                if (historyBytes + size > limits.historyBytes || !fits()) {
                    history.shift();
                    omit('history', 'budget');
                } else {
                    historyBytes += size;
                }
            }
        }
    }

    const data = makeData();
    const serialized = JSON.stringify(data);
    return freeze({
        data,
        serialized,
        bytes: {
            content: data.messages.reduce((sum, message) => sum + bytes(message.content), 0),
            serialized: bytes(serialized),
        },
        omissions,
    });
}
