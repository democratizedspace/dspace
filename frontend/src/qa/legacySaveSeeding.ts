import { isBrowser } from '../utils/ssr.js';
import v1Fixture from './fixtures/legacy_v1_cookie_save.json';
import v2Fixture from './fixtures/legacy_v2_localstorage_save.json';

type CookieSeed = {
    name: string;
    value: string;
};

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const buildCookieString = (name: string, value: string, maxAgeSeconds: number) => {
    let cookieString = `${name}=${value}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`;
    if (isBrowser && typeof location !== 'undefined' && location.protocol === 'https:') {
        cookieString += '; Secure';
    }
    return cookieString;
};

const setCookie = (seed: CookieSeed) => {
    if (!isBrowser) return;
    document.cookie = buildCookieString(seed.name, seed.value, ONE_YEAR_SECONDS);
};

const deleteCookie = (name: string) => {
    if (!isBrowser) return;
    document.cookie = buildCookieString(name, '', 0);
};

const writeLegacyV2LocalStorage = () => {
    if (!isBrowser) return false;
    const entries = v2Fixture?.localStorage ?? {};
    Object.entries(entries).forEach(([key, value]) => {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, serialized);
    });
    return true;
};

export const seedSampleV1CookieSave = () => {
    if (!isBrowser) return false;
    const cookies: CookieSeed[] = v1Fixture?.cookies ?? [];
    cookies.forEach(setCookie);
    return cookies.length > 0;
};

export const seedSampleV2LocalStorageSave = () => writeLegacyV2LocalStorage();

export const clearLegacyV1CookieSave = () => {
    if (!isBrowser) return false;
    const cookies: CookieSeed[] = v1Fixture?.cookies ?? [];
    cookies.forEach(({ name }) => deleteCookie(name));
    return true;
};

export const clearLegacyV2LocalStorageSave = () => {
    if (!isBrowser) return false;
    const entries = v2Fixture?.localStorage ?? {};
    Object.keys(entries).forEach((key) => localStorage.removeItem(key));
    return true;
};

export const refreshLegacyDetection = () => {
    if (!isBrowser || typeof window === 'undefined') return;
    window.location.reload();
};
