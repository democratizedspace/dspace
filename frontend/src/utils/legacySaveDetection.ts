import { isBrowser } from './ssr.js';

const LEGACY_ITEM_COOKIE_REGEX = /^item-\d+$/;
const LEGACY_V2_KEYS = ['gameState', 'gameStateBackup'];
const LEGACY_VERSION_PREFIXES = ['1', '2'];

export type LegacyV1CookieItem = {
    id: string;
    count: number;
};

export type LegacyV1CookieIssue = {
    name: string;
    value: string;
    reason: string;
};

export type LegacyV1CookieDetection = {
    items: LegacyV1CookieItem[];
    cookieKeys: string[];
    invalidCookies: LegacyV1CookieIssue[];
    hasLegacyCookies: boolean;
};

const decodeCookieComponent = (value: string) => {
    try {
        return { decoded: decodeURIComponent(value), hadError: false };
    } catch {
        return { decoded: value, hadError: true };
    }
};

export const detectV1CookieItems = (cookieString?: string): LegacyV1CookieDetection => {
    const source =
        typeof cookieString === 'string' ? cookieString : isBrowser ? document.cookie : '';
    const pairs = source ? source.split(';') : [];
    const items: LegacyV1CookieItem[] = [];
    const cookieKeys: string[] = [];
    const invalidCookies: LegacyV1CookieIssue[] = [];

    pairs.forEach((rawPair) => {
        const trimmed = rawPair.trim();
        if (!trimmed) return;
        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) return;
        const rawName = trimmed.slice(0, separatorIndex);
        const rawValue = trimmed.slice(separatorIndex + 1);
        if (!rawName) return;

        const nameResult = decodeCookieComponent(rawName);
        const valueResult = decodeCookieComponent(rawValue);
        const decodedName = nameResult.decoded.trim();
        const decodedValue = valueResult.decoded.trim();

        if (!LEGACY_ITEM_COOKIE_REGEX.test(decodedName)) return;
        cookieKeys.push(decodedName);

        const parsed = Number.parseFloat(decodedValue);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            invalidCookies.push({
                name: decodedName,
                value: decodedValue || rawValue,
                reason: valueResult.hadError ? 'Unable to decode cookie value.' : 'Invalid count.',
            });
            return;
        }

        if (nameResult.hadError) {
            invalidCookies.push({
                name: decodedName,
                value: rawName,
                reason: 'Unable to decode cookie name.',
            });
        }

        items.push({ id: decodedName.split('-')[1], count: parsed });
    });

    return {
        items,
        cookieKeys,
        invalidCookies,
        hasLegacyCookies: cookieKeys.length > 0,
    };
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

export const detectLegacyArtifacts = (
    v1Detection?: LegacyV1CookieDetection
): LegacyArtifactsDetection => {
    const v1Artifacts = v1Detection ?? detectV1CookieItems();
    return {
        hasV1Cookies: v1Artifacts.hasLegacyCookies,
        hasV2LocalStorage: hasLegacyLocalStorage(),
    };
};
