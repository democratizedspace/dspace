import { isBrowser } from './ssr.js';

export const LEGACY_V2_STORAGE_KEYS = ['gameState', 'gameStateBackup'];
const LEGACY_VERSION_PREFIXES = ['1', '2'];

const unwrapLegacyV2Envelope = (parsed) => {
    if (!parsed || typeof parsed !== 'object') {
        return parsed;
    }
    if ('gameState' in parsed && parsed.gameState && typeof parsed.gameState === 'object') {
        return parsed.gameState;
    }
    return parsed;
};

const isLegacyV2Candidate = (candidate) => {
    if (!candidate || typeof candidate !== 'object') return false;
    const version =
        typeof candidate.versionNumberString === 'string'
            ? candidate.versionNumberString
            : typeof candidate.versionNumber === 'string' ||
                typeof candidate.versionNumber === 'number'
              ? String(candidate.versionNumber)
              : undefined;
    if (version && LEGACY_VERSION_PREFIXES.some((prefix) => version.trim().startsWith(prefix))) {
        return true;
    }
    const hasInventory = candidate.inventory && typeof candidate.inventory === 'object';
    const hasQuests = candidate.quests && typeof candidate.quests === 'object';
    const hasProcesses = candidate.processes && typeof candidate.processes === 'object';
    return hasInventory || hasQuests || hasProcesses;
};

export const evaluateLegacyV2RawEntries = (entries = []) => {
    const errors = [];
    let legacyState;
    let sourceKey;

    for (const entry of entries) {
        if (!entry || !entry.raw) {
            continue;
        }
        try {
            const parsed = JSON.parse(entry.raw);
            const candidate = unwrapLegacyV2Envelope(parsed);
            if (isLegacyV2Candidate(candidate)) {
                legacyState = candidate;
                sourceKey = entry.key;
                break;
            }
            errors.push({
                key: entry.key,
                reason: 'invalid-shape',
                message: 'Missing expected legacy v2 keys or version markers.',
            });
        } catch (error) {
            errors.push({
                key: entry.key,
                reason: 'invalid-json',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unable to parse legacy v2 JSON.',
            });
        }
    }

    return {
        hasLegacyV2Keys: entries.some((entry) => Boolean(entry?.raw)),
        legacyState,
        sourceKey,
        errors,
    };
};

export const readLegacyV2Storage = () => {
    if (!isBrowser) {
        return {
            hasLegacyV2Keys: false,
            legacyState: undefined,
            sourceKey: undefined,
            errors: [],
        };
    }

    const entries = LEGACY_V2_STORAGE_KEYS.map((key) => ({
        key,
        raw: localStorage.getItem(key),
    }));

    return evaluateLegacyV2RawEntries(entries);
};
