import { isBrowser } from './ssr.js';

const LEGACY_ITEM_COOKIE_REGEX = /^item-\d+$/;
const LEGACY_V2_KEYS = ['gameState', 'gameStateBackup'];
const LEGACY_VERSION_PREFIXES = ['1', '2'];

type LegacyCookieIssue = {
    name: string;
    value: string;
    reason: 'decode-error' | 'invalid-count';
};

export type LegacyV1CookieItem = {
    id: string;
    count: number;
};

export type LegacyV1CookieDetection = {
    items: LegacyV1CookieItem[];
    cookieKeys: string[];
    invalidCookies: LegacyCookieIssue[];
};

const decodeCookieComponent = (value: string) => {
    try {
        return { value: decodeURIComponent(value), hadError: false };
    } catch {
        return { value, hadError: true };
    }
};

const parseCookieString = (cookieString = ''): Array<{ name: string; value: string }> => {
    if (typeof cookieString !== 'string' || !cookieString.trim()) return [];

    return cookieString
        .split(';')
        .map((pair) => {
            const trimmed = pair.trim();
            if (!trimmed) return null;
            const separatorIndex = trimmed.indexOf('=');
            if (separatorIndex < 0) return null;
            const name = trimmed.slice(0, separatorIndex).trim();
            const value = trimmed.slice(separatorIndex + 1).trim();
            if (!name) return null;
            return { name, value };
        })
        .filter((entry): entry is { name: string; value: string } => Boolean(entry));
};

export const detectV1CookieItemsFromEntries = (entries = []): LegacyV1CookieDetection => {
    const items: LegacyV1CookieItem[] = [];
    const cookieKeys = new Set<string>();
    const invalidCookies: LegacyCookieIssue[] = [];
    const normalizedEntries = Array.isArray(entries) ? entries : [];

    normalizedEntries.forEach((entry) => {
        const rawName = entry?.name !== undefined ? String(entry.name) : '';
        const rawValue = entry?.value !== undefined ? String(entry.value) : '';
        if (!rawName) return;

        const decodedName = decodeCookieComponent(rawName);
        const decodedValue = decodeCookieComponent(rawValue);
        const name = decodedName.value.trim();
        const value = decodedValue.value.trim();

        if (!LEGACY_ITEM_COOKIE_REGEX.test(name)) return;
        cookieKeys.add(name);

        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed) && parsed > 0) {
            items.push({ id: name.split('-')[1], count: parsed });
            return;
        }

        invalidCookies.push({
            name,
            value,
            reason:
                decodedName.hadError || decodedValue.hadError ? 'decode-error' : 'invalid-count',
        });
    });

    return { items, cookieKeys: Array.from(cookieKeys), invalidCookies };
};

export const detectV1CookieItems = (cookieString = ''): LegacyV1CookieDetection =>
    detectV1CookieItemsFromEntries(parseCookieString(cookieString));

const hasLegacyCookies = () => {
    if (!isBrowser) return false;
    try {
        const { items, cookieKeys } = detectV1CookieItems(document.cookie);
        return items.length > 0 || cookieKeys.length > 0;
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
