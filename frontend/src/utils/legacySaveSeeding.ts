import { isBrowser } from './ssr.js';
import v1Fixture from './legacySaveFixtures/legacy_v1_cookie_save.json' assert { type: 'json' };
import v2Fixture from './legacySaveFixtures/legacy_v2_localstorage_save.json' assert { type: 'json' };

const COOKIE_EXPIRY = 'Fri, 31 Dec 9999 23:59:59 GMT';
export const LEGACY_V2_KEYS = ['gameState', 'gameStateBackup'];
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

type LegacyV1SeedProfile = {
    id: string;
    label: string;
    cookies: CookieFixture[];
    localStorage: LocalStorageFixture[];
};

type LegacyV2SeedProfile = {
    id: string;
    label: string;
    gameState: Record<string, unknown>;
};

export type LegacySeedSummary = {
    profileId: string;
    profileLabel: string;
    cookiesWritten: string[];
    localStorageWritten: string[];
};

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

const resolveV1Profiles = (): LegacyV1SeedProfile[] => {
    const profiles = v1Fixture?.profiles;
    return Array.isArray(profiles) ? (profiles as LegacyV1SeedProfile[]) : [];
};

const resolveV2Profiles = (): LegacyV2SeedProfile[] => {
    const profiles = v2Fixture?.profiles;
    return Array.isArray(profiles) ? (profiles as LegacyV2SeedProfile[]) : [];
};

export const LEGACY_V1_SEED_PROFILES = resolveV1Profiles();
export const LEGACY_V2_SEED_PROFILES = resolveV2Profiles();

const getV1Profile = (profileId: string) => {
    const profile = LEGACY_V1_SEED_PROFILES.find((entry) => entry.id === profileId);
    if (!profile) {
        throw new Error(`Unknown legacy v1 seed profile: ${profileId}`);
    }
    return profile;
};

const getV2Profile = (profileId: string) => {
    const profile = LEGACY_V2_SEED_PROFILES.find((entry) => entry.id === profileId);
    if (!profile) {
        throw new Error(`Unknown legacy v2 seed profile: ${profileId}`);
    }
    return profile;
};

const writeLocalStorage = (key: string, value: string | number) => {
    if (!key) return;
    localStorage.setItem(key, String(value));
};

export const seedLegacyV1Profile = (profileId = 'minimal'): LegacySeedSummary => {
    if (!isBrowser) {
        throw new Error('Legacy save seeding requires a browser environment.');
    }

    if (!LEGACY_V1_SEED_PROFILES.length) {
        throw new Error('No legacy v1 seed profiles are available.');
    }

    const profile = getV1Profile(profileId);
    const cookies = Array.isArray(profile.cookies) ? profile.cookies : [];
    const localStorageEntries = Array.isArray(profile.localStorage) ? profile.localStorage : [];

    cookies.forEach(({ name, value, encodeValue = true }) => writeCookie(name, value, encodeValue));
    localStorageEntries.forEach(({ key, value }) => writeLocalStorage(key, value));

    return {
        profileId: profile.id,
        profileLabel: profile.label,
        cookiesWritten: cookies.map(({ name }) => name),
        localStorageWritten: localStorageEntries.map(({ key }) => key),
    };
};

export const seedLegacyV2Profile = (profileId = 'minimal'): LegacySeedSummary => {
    if (!isBrowser) {
        throw new Error('Legacy save seeding requires a browser environment.');
    }

    if (!LEGACY_V2_SEED_PROFILES.length) {
        throw new Error('No legacy v2 seed profiles are available.');
    }

    const profile = getV2Profile(profileId);
    if (!profile.gameState || typeof profile.gameState !== 'object') {
        throw new Error(`Legacy v2 profile ${profileId} is missing a gameState payload.`);
    }

    const serialized = JSON.stringify(profile.gameState);
    localStorage.setItem('gameState', serialized);

    return {
        profileId: profile.id,
        profileLabel: profile.label,
        cookiesWritten: [],
        localStorageWritten: ['gameState'],
    };
};

export const clearLegacyV1CookieSave = (): void => {
    if (!isBrowser) return;
    const cookieNames = LEGACY_V1_SEED_PROFILES.flatMap((profile) =>
        Array.isArray(profile.cookies) ? profile.cookies.map(({ name }) => name) : []
    );
    [...new Set(cookieNames)].forEach((name) => expireCookie(name));
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
