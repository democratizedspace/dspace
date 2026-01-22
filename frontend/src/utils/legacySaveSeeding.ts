import { isBrowser } from './ssr.js';
import v1Fixture from './legacySaveFixtures/legacy_v1_cookie_save.json' assert { type: 'json' };
import v2Fixture from './legacySaveFixtures/legacy_v2_localstorage_save.json' assert { type: 'json' };
import { LEGACY_V2_SEED_SKIP_KEY, LEGACY_V2_STORAGE_KEYS } from './legacySaveParsing.js';

const COOKIE_EXPIRY = 'Fri, 31 Dec 9999 23:59:59 GMT';
const GAME_STATE_DB_NAME = 'dspaceGameState';

type CookieFixture = {
    name: string;
    value: string | number;
    encodeValue?: boolean;
};

type LocalStorageFixture = {
    key: string;
    value: string | number;
};

type LegacySeedSummary = {
    profileId: string;
    profileLabel: string;
    cookies: string[];
    localStorageKeys: string[];
};

const getV1Profiles = () =>
    v1Fixture?.profiles && typeof v1Fixture.profiles === 'object' ? v1Fixture.profiles : {};

const getV2Profiles = () =>
    v2Fixture?.profiles && typeof v2Fixture.profiles === 'object' ? v2Fixture.profiles : {};

export const LEGACY_V1_SEED_PROFILES = Object.entries(getV1Profiles()).map(([id, profile]) => ({
    id,
    label: profile?.label ?? id,
}));

export const LEGACY_V2_SEED_PROFILES = Object.entries(getV2Profiles()).map(([id, profile]) => ({
    id,
    label: profile?.label ?? id,
}));

const isSecureContext = () =>
    typeof location !== 'undefined' && typeof location.protocol === 'string'
        ? location.protocol === 'https:'
        : false;

const writeCookie = (name: string, rawValue: string | number, encodeValue = true) => {
    if (!name) return;
    const value = encodeValue ? encodeURIComponent(String(rawValue)) : String(rawValue);
    let cookieString = `${name}=${value}; expires=${COOKIE_EXPIRY}; path=/`;
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

const buildSeedSummary = (profileId, profileLabel, cookies = [], localStorageKeys = []) => ({
    profileId,
    profileLabel,
    cookies: cookies.filter(Boolean),
    localStorageKeys: localStorageKeys.filter(Boolean),
});

export const seedLegacyV1Save = (profileId = 'minimal'): LegacySeedSummary => {
    if (!isBrowser) {
        throw new Error('Legacy save seeding requires a browser environment.');
    }

    const profiles = getV1Profiles();
    const profile = profiles?.[profileId];
    const cookies = Array.isArray(profile?.cookies) ? (profile.cookies as CookieFixture[]) : [];
    const localStorageEntries = Array.isArray(profile?.localStorage)
        ? (profile.localStorage as LocalStorageFixture[])
        : [];
    if (!cookies.length && !localStorageEntries.length) {
        throw new Error(`No legacy v1 seed profile is available for "${profileId}".`);
    }

    cookies.forEach(({ name, value, encodeValue = true }) => writeCookie(name, value, encodeValue));
    localStorageEntries.forEach(({ key, value }) => {
        if (!key) return;
        localStorage.setItem(key, String(value));
    });

    return buildSeedSummary(
        profileId,
        profile?.label ?? profileId,
        cookies.map((entry) => entry.name),
        localStorageEntries.map((entry) => entry.key)
    );
};

export const seedLegacyV2LocalStorageSave = (profileId = 'minimal'): LegacySeedSummary => {
    if (!isBrowser) {
        throw new Error('Legacy save seeding requires a browser environment.');
    }

    const profiles = getV2Profiles();
    const profile = profiles?.[profileId];
    const state = profile?.gameState;
    if (!state || typeof state !== 'object') {
        throw new Error(`No legacy v2 seed profile is available for "${profileId}".`);
    }

    const serialized = JSON.stringify(state);
    localStorage.setItem('gameState', serialized);
    localStorage.setItem(LEGACY_V2_SEED_SKIP_KEY, 'true');

    return buildSeedSummary(profileId, profile?.label ?? profileId, [], ['gameState']);
};

export const clearLegacyV1CookieSave = (): void => {
    if (!isBrowser) return;
    const profiles = getV1Profiles();
    const cookieNames = Object.values(profiles)
        .flatMap((profile) => (Array.isArray(profile?.cookies) ? profile.cookies : []))
        .map((entry) => entry?.name)
        .filter(Boolean);
    cookieNames.forEach((name) => expireCookie(name));
};

export const clearLegacyV2LocalStorageSave = (): void => {
    if (!isBrowser) return;
    LEGACY_V2_STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
    });
    localStorage.removeItem(LEGACY_V2_SEED_SKIP_KEY);
};

export const clearSeededLegacySaves = (): void => {
    clearLegacyV1CookieSave();
    clearLegacyV2LocalStorageSave();
};

export const clearV3GameStateStorage = async (): Promise<boolean> => {
    if (!isBrowser) return false;

    LEGACY_V2_STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
    });

    try {
        localStorage.removeItem('root');
        localStorage.removeItem('state');
        localStorage.removeItem('backup');
    } catch {
        /* ignore */
    }

    const deleteResult =
        'indexedDB' in globalThis
            ? await new Promise<boolean>((resolve) => {
                  try {
                      const request = indexedDB.deleteDatabase(GAME_STATE_DB_NAME);
                      request.onsuccess = () => resolve(true);
                      request.onerror = () => resolve(false);
                      request.onblocked = () => resolve(false);
                  } catch {
                      resolve(false);
                  }
              })
            : false;

    return deleteResult;
};
