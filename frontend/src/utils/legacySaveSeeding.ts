import { isBrowser } from './ssr.js';
import v1Fixture from './legacySaveFixtures/legacy_v1_cookie_save.json' assert { type: 'json' };
import v2Fixture from './legacySaveFixtures/legacy_v2_localstorage_save.json' assert {
    type: 'json',
};

const COOKIE_EXPIRY = 'Fri, 31 Dec 9999 23:59:59 GMT';
export const LEGACY_V2_KEYS = ['gameState', 'gameStateBackup'];
const LEGACY_V2_PRIMARY_KEY = 'gameState';
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

type LegacySeedProfile = {
    label: string;
    cookies?: CookieFixture[];
    localStorage?: LocalStorageFixture[];
    gameState?: Record<string, unknown>;
};

export type LegacySeedSummary = {
    profileId: string;
    profileLabel: string;
    cookiesWritten: string[];
    localStorageWritten: string[];
};

export const LEGACY_V1_SEED_PROFILES: Record<string, LegacySeedProfile> =
    v1Fixture?.profiles ?? {};
export const LEGACY_V2_SEED_PROFILES: Record<string, LegacySeedProfile> =
    v2Fixture?.profiles ?? {};

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

const ensureProfilesAvailable = (profiles: Record<string, LegacySeedProfile>, label: string) => {
    if (!profiles || Object.keys(profiles).length === 0) {
        throw new Error(`No legacy ${label} seed profiles are available.`);
    }
};

const getProfile = (profiles: Record<string, LegacySeedProfile>, profileId: string) => {
    ensureProfilesAvailable(profiles, 'save');
    const fallback = profiles.minimal ?? Object.values(profiles)[0];
    const profile = profiles[profileId] ?? fallback;
    if (!profile) {
        throw new Error('No legacy save profiles are configured.');
    }
    return profile;
};

const summarizeSeed = (
    profileId: string,
    profileLabel: string,
    cookiesWritten: string[],
    localStorageWritten: string[]
): LegacySeedSummary => ({
    profileId,
    profileLabel,
    cookiesWritten,
    localStorageWritten,
});

export const seedSampleV1CookieSave = (profileId = 'minimal'): LegacySeedSummary => {
    if (!isBrowser) {
        throw new Error('Legacy save seeding requires a browser environment.');
    }

    const profile = getProfile(LEGACY_V1_SEED_PROFILES, profileId);
    const cookies = Array.isArray(profile?.cookies) ? profile.cookies : [];
    if (!cookies.length) {
        throw new Error('No legacy v1 cookies are available to seed.');
    }

    cookies.forEach(({ name, value, encodeValue = true }) => writeCookie(name, value, encodeValue));

    const localStorageEntries = Array.isArray(profile?.localStorage) ? profile.localStorage : [];
    localStorageEntries.forEach(({ key, value }) => {
        if (!key) return;
        localStorage.setItem(key, String(value));
    });

    return summarizeSeed(
        profileId,
        profile?.label ?? 'v1 legacy seed',
        cookies.map(({ name }) => name),
        localStorageEntries.map(({ key }) => key)
    );
};

export const seedSampleV2LocalStorageSave = (profileId = 'minimal'): LegacySeedSummary => {
    if (!isBrowser) {
        throw new Error('Legacy save seeding requires a browser environment.');
    }

    const profile = getProfile(LEGACY_V2_SEED_PROFILES, profileId);
    const state = profile?.gameState;
    if (!state || typeof state !== 'object') {
        throw new Error('No legacy v2 localStorage state is available to seed.');
    }

    const serialized = JSON.stringify(state);
    localStorage.setItem(LEGACY_V2_PRIMARY_KEY, serialized);

    return summarizeSeed(profileId, profile?.label ?? 'v2 legacy seed', [], [
        LEGACY_V2_PRIMARY_KEY,
    ]);
};

const getSeededCookieNames = () =>
    Object.values(LEGACY_V1_SEED_PROFILES)
        .flatMap((profile) => profile?.cookies ?? [])
        .map((cookie) => cookie.name)
        .filter(Boolean);

export const clearLegacyV1CookieSave = (): void => {
    if (!isBrowser) return;
    const cookies = getSeededCookieNames();
    cookies.forEach((name) => expireCookie(name));
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

export const clearV3GameStateStorage = async (): Promise<boolean> => {
    if (!isBrowser) return false;

    LEGACY_V2_KEYS.forEach((key) => {
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
