import { V1_ITEM_ID_TO_V3_UUID } from './legacyV1ItemIdMap.js';

export const LEGACY_V2_STORAGE_KEYS = ['gameState', 'gameStateBackup'];
export const LEGACY_V2_SEED_SKIP_KEY = 'legacyV2Seeded';

const LEGACY_VERSION_PREFIXES = ['1', '2'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isPlainObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const readLegacyVersion = (candidate) => {
    if (!candidate || typeof candidate !== 'object') return undefined;
    if (typeof candidate.versionNumberString === 'string') {
        return candidate.versionNumberString.trim();
    }
    if (typeof candidate.versionNumber === 'string') {
        return candidate.versionNumber.trim();
    }
    return undefined;
};

const hasLegacyVersion = (version) =>
    Boolean(version) && LEGACY_VERSION_PREFIXES.some((prefix) => version.startsWith(prefix));

const isCurrentVersion = (version) => Boolean(version) && version.startsWith('3');

const hasLegacyShape = (candidate) =>
    Boolean(
        candidate &&
            typeof candidate === 'object' &&
            ('inventory' in candidate || 'quests' in candidate || 'processes' in candidate)
    );

const resolveLegacyV2ItemId = (rawId) => {
    if (rawId === null || rawId === undefined) return null;
    const trimmed = String(rawId).trim();
    if (!trimmed) return null;
    if (UUID_REGEX.test(trimmed)) return trimmed;
    if (/^\d+$/.test(trimmed)) {
        const numeric = Number.parseInt(trimmed, 10);
        if (Number.isFinite(numeric)) {
            return V1_ITEM_ID_TO_V3_UUID[numeric] ?? trimmed;
        }
    }
    return null;
};

const sanitizeInventory = (inventory) => {
    if (!isPlainObject(inventory)) return {};
    const sanitized = {};
    Object.entries(inventory).forEach(([key, value]) => {
        const resolvedId = resolveLegacyV2ItemId(key);
        if (!resolvedId) return;
        if (resolvedId in sanitized) {
            const existing = Number.parseFloat(sanitized[resolvedId]);
            const incoming = Number.parseFloat(value);
            const existingValue = Number.isFinite(existing) ? existing : 0;
            const incomingValue = Number.isFinite(incoming) ? incoming : 0;
            sanitized[resolvedId] = existingValue + incomingValue;
            return;
        }
        sanitized[resolvedId] = value;
    });
    return sanitized;
};

export const normalizeLegacyV2State = (candidate) => {
    if (!isPlainObject(candidate)) {
        return {
            quests: {},
            inventory: {},
            processes: {},
        };
    }

    return {
        quests: isPlainObject(candidate.quests) ? candidate.quests : {},
        inventory: sanitizeInventory(candidate.inventory),
        processes: isPlainObject(candidate.processes) ? candidate.processes : {},
        settings: isPlainObject(candidate.settings) ? candidate.settings : undefined,
    };
};

export const parseLegacyV2Raw = (raw) => {
    if (!raw) {
        return { state: null, isLegacy: false, error: null };
    }

    try {
        const parsed = JSON.parse(raw);
        const candidate =
            parsed && typeof parsed === 'object' && 'gameState' in parsed
                ? parsed.gameState
                : parsed;

        if (!isPlainObject(candidate)) {
            return { state: null, isLegacy: false, error: null };
        }

        const version = readLegacyVersion(candidate);
        const isLegacy =
            hasLegacyVersion(version) || (!isCurrentVersion(version) && hasLegacyShape(candidate));

        if (!isLegacy) {
            return { state: null, isLegacy: false, error: null };
        }

        return {
            state: normalizeLegacyV2State(candidate),
            isLegacy: true,
            error: null,
        };
    } catch (error) {
        return { state: null, isLegacy: false, error };
    }
};

export const readLegacyV2LocalStorage = (storage) => {
    const readStorage = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    const errors = [];
    let hasLegacyKeys = false;
    let state = null;
    let sourceKey;

    if (!readStorage) {
        return { state, sourceKey, errors, hasLegacyKeys };
    }

    LEGACY_V2_STORAGE_KEYS.forEach((key) => {
        const raw = readStorage.getItem(key);
        if (!raw) return;
        hasLegacyKeys = true;
        const parsed = parseLegacyV2Raw(raw);
        if (parsed.error) {
            errors.push({
                key,
                message: parsed.error?.message ?? String(parsed.error),
            });
            return;
        }
        if (!state && parsed.state) {
            state = parsed.state;
            sourceKey = key;
        }
    });

    return { state, sourceKey, errors, hasLegacyKeys };
};
