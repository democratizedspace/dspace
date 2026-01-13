import { isBrowser } from './ssr.js';

export const LEGACY_V2_KEYS = ['gameState', 'gameStateBackup'];
const LEGACY_VERSION_PREFIXES = ['1', '2'];

export const normalizeLegacyV2Payload = (parsed) => {
    if (!parsed || typeof parsed !== 'object') return null;
    if (Object.prototype.hasOwnProperty.call(parsed, 'gameState')) {
        const candidate = parsed.gameState;
        return candidate && typeof candidate === 'object' ? candidate : null;
    }
    return parsed;
};

export const isLegacyV2Candidate = (candidate) => {
    if (!candidate || typeof candidate !== 'object') return false;
    const version =
        typeof candidate.versionNumberString === 'string'
            ? candidate.versionNumberString
            : typeof candidate.versionNumber === 'string'
              ? candidate.versionNumber
              : undefined;
    const normalized = version?.trim();
    if (normalized) {
        return LEGACY_VERSION_PREFIXES.some((prefix) => normalized.startsWith(prefix));
    }
    return ['inventory', 'quests', 'processes'].some((key) => key in candidate);
};

export const readLegacyV2LocalStorage = () => {
    if (!isBrowser) {
        return {
            hasLegacyData: false,
            legacyState: undefined,
            rawKeys: [],
            parseErrors: [],
            sourceKey: undefined,
        };
    }

    const rawKeys = [];
    const parseErrors = [];
    let legacyState;
    let sourceKey;

    LEGACY_V2_KEYS.forEach((key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        rawKeys.push(key);
        try {
            const parsed = JSON.parse(raw);
            const candidate = normalizeLegacyV2Payload(parsed);
            if (candidate && isLegacyV2Candidate(candidate) && !legacyState) {
                legacyState = candidate;
                sourceKey = key;
            }
        } catch (error) {
            parseErrors.push({
                key,
                message: error?.message ? error.message : String(error),
            });
        }
    });

    return {
        hasLegacyData: rawKeys.length > 0,
        legacyState,
        rawKeys,
        parseErrors,
        sourceKey,
    };
};
