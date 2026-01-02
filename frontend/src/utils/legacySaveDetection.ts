import { isBrowser } from './ssr.js';

const LEGACY_ITEM_COOKIE_REGEX = /^item-\d+$/;
const LEGACY_V2_KEYS = ['gameState', 'gameStateBackup'];

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
        return LEGACY_V2_KEYS.some((key) => localStorage.getItem(key));
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
