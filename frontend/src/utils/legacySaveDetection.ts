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
    issues: LegacyV1CookieIssue[];
};

const safeDecode = (value: string): string => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

export const detectV1CookieItems = (cookieString = ''): LegacyV1CookieDetection => {
    const items: LegacyV1CookieItem[] = [];
    const cookieKeys: string[] = [];
    const issues: LegacyV1CookieIssue[] = [];

    const pairs = cookieString
        .split(';')
        .map((pair) => pair.trim())
        .filter(Boolean);

    pairs.forEach((pair) => {
        const equalsIndex = pair.indexOf('=');
        if (equalsIndex <= 0) return;

        const rawName = pair.slice(0, equalsIndex).trim();
        const rawValue = pair.slice(equalsIndex + 1).trim();
        const decodedName = safeDecode(rawName);
        const decodedValue = safeDecode(rawValue);

        if (!LEGACY_ITEM_COOKIE_REGEX.test(decodedName)) return;
        cookieKeys.push(decodedName);

        const parsed = Number.parseFloat(decodedValue);
        if (!Number.isFinite(parsed)) {
            issues.push({
                name: decodedName,
                value: decodedValue,
                reason: 'Value is not a number',
            });
            return;
        }

        if (parsed <= 0) {
            return;
        }

        const id = decodedName.split('-')[1];
        if (!id) {
            issues.push({
                name: decodedName,
                value: decodedValue,
                reason: 'Missing item id',
            });
            return;
        }

        items.push({ id, count: parsed });
    });

    return { items, cookieKeys, issues };
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
    v1CookieItems: LegacyV1CookieItem[];
    v1CookieKeys: string[];
    v1CookieIssues: LegacyV1CookieIssue[];
};

export const detectLegacyArtifacts = (): LegacyArtifactsDetection => {
    const v1Detection = isBrowser ? detectV1CookieItems(document.cookie ?? '') : null;
    const v1CookieItems = v1Detection?.items ?? [];
    const v1CookieKeys = v1Detection?.cookieKeys ?? [];
    const v1CookieIssues = v1Detection?.issues ?? [];
    const hasV1Cookies = v1CookieItems.length > 0 || v1CookieIssues.length > 0;

    return {
        hasV1Cookies,
        hasV2LocalStorage: hasLegacyLocalStorage(),
        v1CookieItems,
        v1CookieKeys,
        v1CookieIssues,
    };
};
