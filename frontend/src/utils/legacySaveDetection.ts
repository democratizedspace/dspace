import { readLegacyV2Storage } from './legacyV2Storage.js';
import { isBrowser } from './ssr.js';

const LEGACY_ITEM_COOKIE_REGEX = /^item-\d+$/;
const LEGACY_CURRENCY_COOKIE_REGEX = /^currency-balance-(?<symbol>[a-z0-9-]+)$/i;

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

export type LegacyCookieCurrencyBalance = {
    symbol: string;
    balance: number;
};

export const detectV1CookieItems = (cookieString = '') => {
    const items: LegacyCookieItem[] = [];
    const invalidItems: LegacyCookieIssue[] = [];
    const currencyBalances: LegacyCookieCurrencyBalance[] = [];
    const cookieKeys = new Set<string>();

    const cookies = cookieString ? cookieString.split(';') : [];

    cookies.forEach((pair) => {
        const trimmed = pair.trim();
        if (!trimmed) return;

        const separatorIndex = trimmed.indexOf('=');
        const rawName = separatorIndex >= 0 ? trimmed.slice(0, separatorIndex) : trimmed;
        const rawValue = separatorIndex >= 0 ? trimmed.slice(separatorIndex + 1) : '';

        const decodedName = decodeCookieComponent(rawName);
        const decodedValue = decodeCookieComponent(rawValue);
        const itemMatch = LEGACY_ITEM_COOKIE_REGEX.test(decodedName);
        const currencyMatch = decodedName.match(LEGACY_CURRENCY_COOKIE_REGEX);

        if (!itemMatch && !currencyMatch) return;

        cookieKeys.add(decodedName);

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

        if (itemMatch) {
            items.push({
                id: decodedName.split('-')[1],
                count: parsed,
            });
            return;
        }

        const symbol = currencyMatch?.groups?.symbol;
        if (symbol) {
            currencyBalances.push({ symbol, balance: parsed });
        }
    });

    return {
        items,
        invalidItems,
        currencyBalances,
        cookieKeys: Array.from(cookieKeys),
    };
};

export type LegacyArtifactsDetection = {
    hasV1Cookies: boolean;
    hasV2LocalStorage: boolean;
    v1Items: LegacyCookieItem[];
    v1InvalidItems: LegacyCookieIssue[];
    v1CookieKeys: string[];
    v1CurrencyBalances: LegacyCookieCurrencyBalance[];
    v2State?: Record<string, unknown>;
    v2SourceKey?: string;
    v2Errors?: { key: string; reason: string; message: string }[];
};

export const detectLegacyArtifacts = (): LegacyArtifactsDetection => {
    const v1Detection = isBrowser ? detectV1CookieItems(document.cookie ?? '') : null;
    const v1Items = v1Detection?.items ?? [];
    const v1InvalidItems = v1Detection?.invalidItems ?? [];
    const v1CookieKeys = v1Detection?.cookieKeys ?? [];
    const v1CurrencyBalances = v1Detection?.currencyBalances ?? [];
    const v2Detection = isBrowser ? readLegacyV2Storage() : null;

    return {
        hasV1Cookies:
            v1Items.length > 0 || v1CurrencyBalances.length > 0 || v1CookieKeys.length > 0,
        hasV2LocalStorage: Boolean(v2Detection?.hasLegacyV2Keys),
        v1Items,
        v1InvalidItems,
        v1CookieKeys,
        v1CurrencyBalances,
        v2State: v2Detection?.legacyState,
        v2SourceKey: v2Detection?.sourceKey,
        v2Errors: v2Detection?.errors ?? [],
    };
};
