import { isBrowser } from './ssr.js';

const LEGACY_ITEM_COOKIE_REGEX = /^item-\d+$/;
const LEGACY_V2_KEYS = ['gameState', 'gameStateBackup'];
const LEGACY_VERSION_PREFIXES = ['1', '2'];

type LegacyCookieIssue = {
    name: string;
    value: string;
    reason: string;
};

const decodeCookieComponent = (value: string) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

export type LegacyCookieItem = {
    id: string;
    count: number;
};

export const detectV1CookieItems = (cookieString = '') => {
    const items: LegacyCookieItem[] = [];
    const invalidItems: LegacyCookieIssue[] = [];
    const cookieKeys = new Set<string>();

    const cookies = cookieString ? cookieString.split(';') : [];

    cookies.forEach((pair) => {
        const trimmed = pair.trim();
        if (!trimmed) return;

        const separatorIndex = trimmed.indexOf('=');
        const rawName = separatorIndex >= 0 ? trimmed.slice(0, separatorIndex) : trimmed;
        const rawValue = separatorIndex >= 0 ? trimmed.slice(separatorIndex + 1) : '';

        const decodedName = decodeCookieComponent(rawName);
        if (!LEGACY_ITEM_COOKIE_REGEX.test(decodedName)) return;

        cookieKeys.add(decodedName);

        const decodedValue = decodeCookieComponent(rawValue);
        const parsed = Number.parseFloat(decodedValue);

        if (!Number.isFinite(parsed)) {
            invalidItems.push({
                name: decodedName,
                value: decodedValue,
                reason: 'non-numeric value',
            });
            return;
        }

        if (parsed <= 0) {
            invalidItems.push({
                name: decodedName,
                value: decodedValue,
                reason: 'non-positive count',
            });
            return;
        }

        items.push({
            id: decodedName.split('-')[1],
            count: parsed,
        });
    });

    return {
        items,
        invalidItems,
        cookieKeys: Array.from(cookieKeys),
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
    v1Items: LegacyCookieItem[];
    v1InvalidItems: LegacyCookieIssue[];
    v1CookieKeys: string[];
};

export const detectLegacyArtifacts = (): LegacyArtifactsDetection => {
    const v1Detection = isBrowser ? detectV1CookieItems(document.cookie ?? '') : null;
    const v1Items = v1Detection?.items ?? [];
    const v1InvalidItems = v1Detection?.invalidItems ?? [];
    const v1CookieKeys = v1Detection?.cookieKeys ?? [];

    return {
        hasV1Cookies: v1Items.length > 0 || v1CookieKeys.length > 0,
        hasV2LocalStorage: hasLegacyLocalStorage(),
        v1Items,
        v1InvalidItems,
        v1CookieKeys,
    };
};
