import { isBrowser } from './ssr.js';
import v1Fixture from './legacySaveFixtures/legacy_v1_cookie_save.json' assert { type: 'json' };
import v2Fixture from './legacySaveFixtures/legacy_v2_localstorage_save.json' assert { type: 'json' };

const COOKIE_EXPIRY = 'Fri, 31 Dec 9999 23:59:59 GMT';
const LEGACY_V2_KEYS = ['gameState', 'gameStateBackup'];

const isSecureContext = () =>
    typeof location !== 'undefined' && typeof location.protocol === 'string'
        ? location.protocol === 'https:'
        : false;

const writeCookie = (name: string, rawValue: string | number) => {
    if (!name) return;
    const encodedValue = encodeURIComponent(String(rawValue));
    let cookieString = `${name}=${encodedValue}; expires=${COOKIE_EXPIRY}; path=/`;
    if (isSecureContext()) {
        cookieString += '; Secure';
    }
    document.cookie = cookieString;
};

const expireCookie = (name: string) => {
    if (!name) return;
    let cookieString = `${name}=; Max-Age=0; path=/`;
    if (isSecureContext()) {
        cookieString += '; Secure';
    }
    document.cookie = cookieString;
};

export const seedSampleV1CookieSave = (): void => {
    if (!isBrowser) {
        throw new Error('Legacy save seeding requires a browser environment.');
    }

    const cookies = Array.isArray(v1Fixture?.cookies) ? v1Fixture.cookies : [];
    if (!cookies.length) {
        throw new Error('No legacy v1 cookies are available to seed.');
    }

    cookies.forEach(({ name, value }) => writeCookie(name, value));
};

export const seedSampleV2LocalStorageSave = (): void => {
    if (!isBrowser) {
        throw new Error('Legacy save seeding requires a browser environment.');
    }

    const state = v2Fixture?.gameState;
    if (!state || typeof state !== 'object') {
        throw new Error('No legacy v2 localStorage state is available to seed.');
    }

    const serialized = JSON.stringify(state);
    LEGACY_V2_KEYS.forEach((key) => {
        localStorage.setItem(key, serialized);
    });
};

export const clearLegacyV1CookieSave = (): void => {
    if (!isBrowser) return;
    const cookies = Array.isArray(v1Fixture?.cookies) ? v1Fixture.cookies : [];
    cookies.forEach(({ name }) => expireCookie(name));
};

export const clearLegacyV2LocalStorageSave = (): void => {
    if (!isBrowser) return;
    LEGACY_V2_KEYS.forEach((key) => {
        localStorage.removeItem(key);
    });
};

export const clearSeededLegacySaves = (): void => {
    clearLegacyV1CookieSave();
    clearLegacyV2LocalStorageSave();
};
