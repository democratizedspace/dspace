import { isBrowser } from './ssr.js';

const LEGACY_ITEM_COOKIE_REGEX = /^item-\d+$/;
const LEGACY_V2_KEYS = ['gameState', 'gameStateBackup'];
const LEGACY_VERSION_PREFIXES = ['1', '2'];

const hasLegacyCookies = () => {
    if (!isBrowser) return false;
    try {
        const cookies = document.cookie ? document.cookie.split(';') : [];
        return cookies.some((pair) => {
            const [rawName, rawValue] = pair.trim().split('=');
            if (!rawName || typeof rawValue !== 'string') return false;
            const decodedName = decodeURIComponent(rawName);
            const decodedValue = decodeURIComponent(rawValue);
            if (!LEGACY_ITEM_COOKIE_REGEX.test(decodedName)) return false;
            const parsed = Number.parseFloat(decodedValue);
            return Number.isFinite(parsed) && parsed > 0;
        });
    } catch {
        return false;
    }
};

const hasLegacyLocalStorage = () => {
    if (!isBrowser) return false;
    try {
        return LEGACY_V2_KEYS.some((key) => {
            const raw = localStorage.getItem(key);
            if (!raw) return false;
            try {
                const parsed = JSON.parse(raw);
                const candidate =
                    parsed && typeof parsed === 'object' && 'gameState' in parsed
                        ? parsed.gameState
                        : parsed;
                if (!candidate || typeof candidate !== 'object') return false;
                const version =
                    typeof candidate.versionNumberString === 'string'
                        ? candidate.versionNumberString
                        : typeof candidate.versionNumber === 'string'
                          ? candidate.versionNumber
                          : undefined;
                if (!version) return false;
                const normalized = version.trim();
                if (!normalized) return false;
                return LEGACY_VERSION_PREFIXES.some((prefix) => normalized.startsWith(prefix));
            } catch {
                return false;
            }
        });
    } catch {
        return false;
    }
};

export type LegacyArtifactsDetection = {
    hasV1Cookies: boolean;
    hasV2LocalStorage: boolean;
};

export const detectLegacyArtifacts = (): LegacyArtifactsDetection => ({
    hasV1Cookies: hasLegacyCookies(),
    hasV2LocalStorage: hasLegacyLocalStorage(),
});
