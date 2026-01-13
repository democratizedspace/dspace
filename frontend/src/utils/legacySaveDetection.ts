import { isBrowser } from './ssr.js';

const LEGACY_ITEM_COOKIE_REGEX = /^item-\d+$/;
const LEGACY_CURRENCY_COOKIE_REGEX = /^currency-balance-([a-zA-Z]+)$/;
const LEGACY_V2_KEYS = ['gameState', 'gameStateBackup'];
const LEGACY_VERSION_PREFIXES = ['1', '2'];
const LEGACY_V2_SHAPE_KEYS = ['inventory', 'quests', 'processes'];
const LEGACY_SUPPORTED_CURRENCIES = new Set(['dUSD']);

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

export type LegacyCurrencyBalance = {
    symbol: string;
    balance: number;
};

export type LegacyLocalStorageParseError = {
    key: string;
    message: string;
};

export const detectV1CookieItems = (cookieString = '') => {
    const items: LegacyCookieItem[] = [];
    const invalidItems: LegacyCookieIssue[] = [];
    const currencyBalances: LegacyCurrencyBalance[] = [];
    const cookieKeys = new Set<string>();

    const cookies = cookieString ? cookieString.split(';') : [];

    cookies.forEach((pair) => {
        const trimmed = pair.trim();
        if (!trimmed) return;

        const separatorIndex = trimmed.indexOf('=');
        const rawName = separatorIndex >= 0 ? trimmed.slice(0, separatorIndex) : trimmed;
        const rawValue = separatorIndex >= 0 ? trimmed.slice(separatorIndex + 1) : '';

        const decodedName = decodeCookieComponent(rawName);
        if (LEGACY_ITEM_COOKIE_REGEX.test(decodedName)) {
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
            return;
        }

        const currencyMatch = decodedName.match(LEGACY_CURRENCY_COOKIE_REGEX);
        if (!currencyMatch) return;

        const symbol = currencyMatch[1];
        if (!LEGACY_SUPPORTED_CURRENCIES.has(symbol)) return;

        cookieKeys.add(decodedName);
        const decodedValue = decodeCookieComponent(rawValue);
        const parsed = Number.parseFloat(decodedValue);

        if (!Number.isFinite(parsed)) {
            invalidItems.push({
                name: decodedName,
                value: decodedValue,
                reason: 'non-numeric balance',
            });
            return;
        }

        if (parsed <= 0) {
            invalidItems.push({
                name: decodedName,
                value: decodedValue,
                reason: 'non-positive balance',
            });
            return;
        }

        currencyBalances.push({ symbol, balance: parsed });
    });

    return {
        items,
        invalidItems,
        cookieKeys: Array.from(cookieKeys),
        currencyBalances,
    };
};

const extractLegacyV2Candidate = (parsed: unknown) => {
    if (parsed && typeof parsed === 'object' && 'gameState' in parsed) {
        return (parsed as { gameState?: unknown }).gameState;
    }
    return parsed;
};

const isLegacyV2Candidate = (candidate: unknown) => {
    if (!candidate || typeof candidate !== 'object') return false;
    const record = candidate as Record<string, unknown>;
    const version =
        typeof record.versionNumberString === 'string'
            ? record.versionNumberString
            : typeof record.versionNumber === 'string'
              ? record.versionNumber
              : undefined;
    if (version) {
        const normalized = version.trim();
        if (normalized) {
            return LEGACY_VERSION_PREFIXES.some((prefix) => normalized.startsWith(prefix));
        }
    }

    return LEGACY_V2_SHAPE_KEYS.some((key) => key in record);
};

const inspectLegacyLocalStorage = () => {
    const parseErrors: LegacyLocalStorageParseError[] = [];
    if (!isBrowser) return { hasLegacyV2: false, parseErrors };
    try {
        const hasLegacyV2 = LEGACY_V2_KEYS.some((key) => {
            const raw = localStorage.getItem(key);
            if (!raw) return false;
            try {
                const parsed = JSON.parse(raw);
                const candidate = extractLegacyV2Candidate(parsed);
                return isLegacyV2Candidate(candidate);
            } catch {
                parseErrors.push({
                    key,
                    message: 'Invalid JSON in legacy localStorage.',
                });
                return false;
            }
        });
        return { hasLegacyV2, parseErrors };
    } catch {
        return { hasLegacyV2: false, parseErrors };
    }
};

export type LegacyArtifactsDetection = {
    hasV1Cookies: boolean;
    hasV2LocalStorage: boolean;
    v1Items: LegacyCookieItem[];
    v1InvalidItems: LegacyCookieIssue[];
    v1CookieKeys: string[];
    v1CurrencyBalances: LegacyCurrencyBalance[];
    v2ParseErrors: LegacyLocalStorageParseError[];
};

export const detectLegacyArtifacts = (): LegacyArtifactsDetection => {
    const v1Detection = isBrowser ? detectV1CookieItems(document.cookie ?? '') : null;
    const v1Items = v1Detection?.items ?? [];
    const v1InvalidItems = v1Detection?.invalidItems ?? [];
    const v1CookieKeys = v1Detection?.cookieKeys ?? [];
    const v1CurrencyBalances = v1Detection?.currencyBalances ?? [];
    const { hasLegacyV2, parseErrors } = inspectLegacyLocalStorage();

    return {
        hasV1Cookies: v1Items.length > 0 || v1CookieKeys.length > 0,
        hasV2LocalStorage: hasLegacyV2,
        v1Items,
        v1InvalidItems,
        v1CookieKeys,
        v1CurrencyBalances,
        v2ParseErrors: parseErrors,
    };
};
