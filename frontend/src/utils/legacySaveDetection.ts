import { isBrowser } from './ssr.js';
import { readLegacyV2LocalStorage } from './legacySaveV2.js';

const LEGACY_ITEM_COOKIE_REGEX = /^item-\d+$/;
const LEGACY_CURRENCY_COOKIE_REGEX = /^currency-balance-(?<symbol>[^=]+)$/;

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
    source: 'item' | 'currency';
    legacyKey: string;
    currencySymbol?: string;
};

const parseCookieCount = (
    name: string,
    rawValue: string,
    invalidItems: LegacyCookieIssue[]
): number | null => {
    const decodedValue = decodeCookieComponent(rawValue);
    const parsed = Number.parseFloat(decodedValue);

    if (!Number.isFinite(parsed)) {
        invalidItems.push({
            name,
            value: decodedValue,
            reason: 'non-numeric value',
        });
        return null;
    }

    if (parsed <= 0) {
        invalidItems.push({
            name,
            value: decodedValue,
            reason: 'non-positive count',
        });
        return null;
    }

    return parsed;
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
        const itemMatch = LEGACY_ITEM_COOKIE_REGEX.test(decodedName);
        const currencyMatch = decodedName.match(LEGACY_CURRENCY_COOKIE_REGEX);

        if (!itemMatch && !currencyMatch) return;

        cookieKeys.add(decodedName);
        const parsed = parseCookieCount(decodedName, rawValue, invalidItems);
        if (!parsed) return;

        if (itemMatch) {
            items.push({
                id: decodedName.split('-')[1],
                count: parsed,
                source: 'item',
                legacyKey: decodedName,
            });
        } else if (currencyMatch?.groups?.symbol) {
            items.push({
                id: currencyMatch.groups.symbol,
                count: parsed,
                source: 'currency',
                legacyKey: decodedName,
                currencySymbol: currencyMatch.groups.symbol,
            });
        }
    });

    return {
        items,
        invalidItems,
        cookieKeys: Array.from(cookieKeys),
    };
};

export type LegacyArtifactsDetection = {
    hasV1Cookies: boolean;
    hasV2LocalStorage: boolean;
    v1Items: LegacyCookieItem[];
    v1InvalidItems: LegacyCookieIssue[];
    v1CookieKeys: string[];
    v2ParseErrors: { key: string; message: string }[];
    v2RawKeys: string[];
};

export const detectLegacyArtifacts = (): LegacyArtifactsDetection => {
    const v1Detection = isBrowser ? detectV1CookieItems(document.cookie ?? '') : null;
    const v1Items = v1Detection?.items ?? [];
    const v1InvalidItems = v1Detection?.invalidItems ?? [];
    const v1CookieKeys = v1Detection?.cookieKeys ?? [];
    const v2Detection = readLegacyV2LocalStorage();

    return {
        hasV1Cookies: v1Items.length > 0 || v1CookieKeys.length > 0,
        hasV2LocalStorage: v2Detection.hasLegacyData,
        v1Items,
        v1InvalidItems,
        v1CookieKeys,
        v2ParseErrors: v2Detection.parseErrors ?? [],
        v2RawKeys: v2Detection.rawKeys ?? [],
    };
};
