import { isBrowser } from '../utils/ssr.js';
import v1CookieFixture from './fixtures/legacy_v1_cookie_save.json' assert { type: 'json' };
import v2LocalStorageFixture from './fixtures/legacy_v2_localstorage_save.json' assert { type: 'json' };

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const COOKIE_EXPIRES = 'Fri, 31 Dec 9999 23:59:59 GMT';

type LegacyCookie = { name: string; value: string };
type LegacyLocalStorageEntry = { key: string; value: unknown };

const cookieSeeds: LegacyCookie[] = Array.isArray(v1CookieFixture.cookies)
    ? v1CookieFixture.cookies
    : [];

const localStorageSeeds: LegacyLocalStorageEntry[] = Array.isArray(
    v2LocalStorageFixture.localStorage
)
    ? v2LocalStorageFixture.localStorage
    : [];

const shouldUseSecureCookies = () =>
    typeof location !== 'undefined' && typeof location.protocol === 'string'
        ? location.protocol === 'https:'
        : false;

const setCookie = (name: string, value: string, options?: { maxAge?: number }) => {
    if (!isBrowser) return;
    const parts = [
        `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
        options?.maxAge === 0 ? 'Max-Age=0' : `Expires=${COOKIE_EXPIRES}`,
        'Path=/',
        'SameSite=Lax',
    ];
    if (typeof options?.maxAge === 'number' && options.maxAge > 0) {
        parts[1] = `Max-Age=${Math.round(options.maxAge)}`;
    }
    if (shouldUseSecureCookies()) {
        parts.push('Secure');
    }
    document.cookie = parts.join('; ');
};

const writeLocalStorage = (entries: LegacyLocalStorageEntry[]) => {
    if (!isBrowser) return false;
    try {
        entries.forEach(({ key, value }) => {
            localStorage.setItem(key, JSON.stringify(value));
        });
        return true;
    } catch (error) {
        console.error('Unable to seed legacy localStorage save', error);
        return false;
    }
};

const clearLocalStorageEntries = (entries: LegacyLocalStorageEntry[]) => {
    if (!isBrowser) return false;
    try {
        entries.forEach(({ key }) => {
            localStorage.removeItem(key);
        });
        return true;
    } catch (error) {
        console.error('Unable to clear legacy localStorage seeds', error);
        return false;
    }
};

export const seedSampleV1CookieSave = (): boolean => {
    if (!isBrowser) return false;
    try {
        cookieSeeds.forEach(({ name, value }) =>
            setCookie(name, value, { maxAge: ONE_YEAR_SECONDS })
        );
        return true;
    } catch (error) {
        console.error('Unable to seed v1 cookie save', error);
        return false;
    }
};

export const clearLegacyV1CookieSave = (): boolean => {
    if (!isBrowser) return false;
    try {
        cookieSeeds.forEach(({ name }) => setCookie(name, '', { maxAge: 0 }));
        return true;
    } catch (error) {
        console.error('Unable to clear legacy v1 cookies', error);
        return false;
    }
};

export const seedSampleV2LocalStorageSave = (): boolean => writeLocalStorage(localStorageSeeds);

export const clearLegacyV2LocalStorageSave = (): boolean =>
    clearLocalStorageEntries(localStorageSeeds);

export const clearSeededLegacySaves = (): boolean => {
    const clearedCookies = clearLegacyV1CookieSave();
    const clearedLocalStorage = clearLegacyV2LocalStorageSave();
    return clearedCookies && clearedLocalStorage;
};

export const legacyV1CookieSeeds = [...cookieSeeds];
export const legacyV2LocalStorageSeeds = [...localStorageSeeds];
