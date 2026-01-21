export const LEGACY_V2_STORAGE_KEYS = ['gameState', 'gameStateBackup'];

const LEGACY_VERSION_PREFIXES = ['1', '2'];

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

const hasV3Meta = (candidate) => {
    if (!candidate || typeof candidate !== 'object') return false;
    const meta = candidate._meta;
    return Boolean(meta && typeof meta === 'object' && typeof meta.lastUpdated === 'number');
};

const sanitizeInventory = (inventory) => {
    if (!isPlainObject(inventory)) return {};
    const sanitized = {};
    Object.entries(inventory).forEach(([key, value]) => {
        if (!key) return;
        sanitized[key] = value;
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
        const isV3State = isCurrentVersion(version) || hasV3Meta(candidate);
        const isLegacy =
            !isV3State &&
            (hasLegacyVersion(version) ||
                (!isCurrentVersion(version) && hasLegacyShape(candidate)));

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
