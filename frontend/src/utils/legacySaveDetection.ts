import { isBrowser } from './ssr.js';
import { readLegacyV2LocalStorage } from './legacySaveParsing.js';

const LEGACY_ITEM_COOKIE_REGEX = /^item-\d+$/;
const LEGACY_CURRENCY_COOKIE_PREFIX = 'currency-balance-';

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

export const detectV1CookieItems = (cookieString = '') => {
    const items: LegacyCookieItem[] = [];
    const invalidItems: LegacyCookieIssue[] = [];
    const currencyBalances: LegacyCurrencyBalance[] = [];
    const invalidCurrency: LegacyCookieIssue[] = [];
    const cookieKeys = new Set<string>();

    const cookies = cookieString ? cookieString.split(';') : [];

    cookies.forEach((pair) => {
        const trimmed = pair.trim();
        if (!trimmed) return;

        const separatorIndex = trimmed.indexOf('=');
        const rawName = separatorIndex >= 0 ? trimmed.slice(0, separatorIndex) : trimmed;
        const rawValue = separatorIndex >= 0 ? trimmed.slice(separatorIndex + 1) : '';

        const decodedName = decodeCookieComponent(rawName);
        const isItemCookie = LEGACY_ITEM_COOKIE_REGEX.test(decodedName);
        const isCurrencyCookie = decodedName.startsWith(LEGACY_CURRENCY_COOKIE_PREFIX);
        if (!isItemCookie && !isCurrencyCookie) return;

        cookieKeys.add(decodedName);

        const decodedValue = decodeCookieComponent(rawValue);
        const parsed = Number.parseFloat(decodedValue);

        if (!Number.isFinite(parsed)) {
            const targetList = isCurrencyCookie ? invalidCurrency : invalidItems;
            targetList.push({
                name: decodedName,
                value: decodedValue,
                reason: 'non-numeric value',
            });
            return;
        }

        if (parsed <= 0) {
            const targetList = isCurrencyCookie ? invalidCurrency : invalidItems;
            targetList.push({
                name: decodedName,
                value: decodedValue,
                reason: 'non-positive count',
            });
            return;
        }

        if (isCurrencyCookie) {
            const symbol = decodedName.slice(LEGACY_CURRENCY_COOKIE_PREFIX.length);
            if (!symbol) {
                invalidCurrency.push({
                    name: decodedName,
                    value: decodedValue,
                    reason: 'missing currency symbol',
                });
                return;
            }
            currencyBalances.push({
                symbol,
                balance: parsed,
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
        currencyBalances,
        invalidCurrency,
        cookieKeys: Array.from(cookieKeys),
    };
};

export type LegacyArtifactsDetection = {
    hasV1Cookies: boolean;
    hasV2LocalStorage: boolean;
    v1Items: LegacyCookieItem[];
    v1InvalidItems: LegacyCookieIssue[];
    v1CurrencyBalances: LegacyCurrencyBalance[];
    v1CurrencyIssues: LegacyCookieIssue[];
    v1CookieKeys: string[];
    v2ParseIssues: LegacyCookieIssue[];
};

export const detectLegacyArtifacts = (): LegacyArtifactsDetection => {
    const v1Detection = isBrowser ? detectV1CookieItems(document.cookie ?? '') : null;
    const v1Items = v1Detection?.items ?? [];
    const v1InvalidItems = v1Detection?.invalidItems ?? [];
    const v1CurrencyBalances = v1Detection?.currencyBalances ?? [];
    const v1CurrencyIssues = v1Detection?.invalidCurrency ?? [];
    const v1CookieKeys = v1Detection?.cookieKeys ?? [];
    const v2Detection = isBrowser ? readLegacyV2LocalStorage() : null;
    const v2ParseIssues =
        v2Detection?.errors?.map((issue) => ({
            name: issue.key,
            value: '',
            reason: issue.message,
        })) ?? [];
    const hasV2State = Boolean(v2Detection?.state);
    const hasV2ParseIssues = v2ParseIssues.length > 0;

    return {
        hasV1Cookies:
            v1Items.length > 0 || v1CookieKeys.length > 0 || v1CurrencyBalances.length > 0,
        hasV2LocalStorage: hasV2State || hasV2ParseIssues,
        v1Items,
        v1InvalidItems,
        v1CurrencyBalances,
        v1CurrencyIssues,
        v1CookieKeys,
        v2ParseIssues,
    };
};
