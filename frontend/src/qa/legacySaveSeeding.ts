import legacyV1Cookies from './fixtures/legacy_v1_cookie_save.json' assert { type: 'json' };
import legacyV2LocalStorage from './fixtures/legacy_v2_localstorage_save.json' assert { type: 'json' };
import { isBrowser } from '../utils/ssr.js';

type LegacyCookie = { name: string; value: string };
type LegacyV1Fixture = { cookies: LegacyCookie[] };
type LegacyV2Fixture = { localStorage: Record<string, unknown> };

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const isHttps = () => (isBrowser ? globalThis.location?.protocol === 'https:' : false);

const writeCookies = (cookies: LegacyCookie[]) => {
    if (!isBrowser) return false;
    if (!Array.isArray(cookies) || cookies.length === 0) return false;

    const secure = isHttps();
    cookies.forEach(({ name, value }) => {
        if (!name) return;
        const normalizedValue = value ?? '';
        let cookieString = `${name}=${normalizedValue}; path=/; max-age=${ONE_YEAR_SECONDS}`;
        if (secure) {
            cookieString += '; secure';
        }
        document.cookie = cookieString;
    });

    return true;
};

const clearCookies = (cookies: LegacyCookie[]) => {
    if (!isBrowser) return false;
    if (!Array.isArray(cookies) || cookies.length === 0) return false;

    cookies.forEach(({ name }) => {
        if (!name) return;
        document.cookie = `${name}=; path=/; max-age=0`;
    });

    return true;
};

const writeLocalStorageEntries = (entries: Record<string, unknown>) => {
    if (!isBrowser) return false;
    if (!entries) return false;

    Object.entries(entries).forEach(([key, value]) => {
        if (!key) return;
        try {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, serialized);
        } catch (error) {
            console.warn(`Unable to write legacy localStorage key "${key}"`, error);
        }
    });

    return true;
};

const clearLocalStorageEntries = (entries: Record<string, unknown>) => {
    if (!isBrowser) return false;
    if (!entries) return false;

    Object.keys(entries).forEach((key) => {
        if (!key) return;
        localStorage.removeItem(key);
    });

    return true;
};

const refreshPage = () => {
    if (!isBrowser) return;
    window.location.reload();
};

type SeedOptions = {
    refresh?: boolean;
};

export const seedSampleV1CookieSave = (options: SeedOptions = {}) => {
    const fixture = legacyV1Cookies as LegacyV1Fixture;
    const ok = writeCookies(fixture.cookies);
    if (ok && options.refresh !== false) {
        refreshPage();
    }
    return ok;
};

export const clearLegacyV1CookieSave = (options: SeedOptions = {}) => {
    const fixture = legacyV1Cookies as LegacyV1Fixture;
    const ok = clearCookies(fixture.cookies);
    if (ok && options.refresh !== false) {
        refreshPage();
    }
    return ok;
};

export const seedSampleV2LocalStorageSave = (options: SeedOptions = {}) => {
    const fixture = legacyV2LocalStorage as LegacyV2Fixture;
    const ok = writeLocalStorageEntries(fixture.localStorage);
    if (ok && options.refresh !== false) {
        refreshPage();
    }
    return ok;
};

export const clearLegacyV2LocalStorageSave = (options: SeedOptions = {}) => {
    const fixture = legacyV2LocalStorage as LegacyV2Fixture;
    const ok = clearLocalStorageEntries(fixture.localStorage);
    if (ok && options.refresh !== false) {
        refreshPage();
    }
    return ok;
};
