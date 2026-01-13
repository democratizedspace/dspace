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

type LegacySeedSummary = {
    profileId: string;
    profileLabel: string;
    cookiesWritten: string[];
    localStorageKeysWritten: string[];
};

type LegacySeedProfile = {
    id: string;
    label: string;
    description: string;
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

const v1Profiles = v1Fixture?.profiles ?? {};
const v2Profiles = v2Fixture?.profiles ?? {};

export const LEGACY_V1_SEED_PROFILES: LegacySeedProfile[] = [
    {
        id: 'minimal',
        label: 'Minimal v1 (cookies only)',
        description: 'acceptedCookies + item-* + currency-balance-dUSD cookies.',
    },
    {
        id: 'maximal',
        label: 'Maximal v1 (cookies + localStorage)',
        description: 'Cookies plus process start + machine lock localStorage keys.',
    },
];

export const LEGACY_V2_SEED_PROFILES: LegacySeedProfile[] = [
    {
        id: 'minimal',
        label: 'Minimal v2.1 (gameState only)',
        description: 'Basic inventory + quest state.',
    },
    {
        id: 'inProgress',
        label: 'In-progress v2.1 process',
        description: 'Includes a running legacy process timer.',
    },
    {
        id: 'messy',
        label: 'Messy v2.1 (real-world)',
        description: 'Includes unknown keys, inventory[\"\"] artifact, and openAI.apiKey.',
    },
];

const V1_LOCAL_STORAGE_PROFILES: Record<string, { key: string; value: string | number }[]> = {
    minimal: [],
    maximal: [
        { key: 'process-3dprint-benchy-starttime', value: 1700000000000 },
        { key: 'machine-lock-0', value: 1 },
    ],
};

const getV1ProfileCookies = (profileId: string) => {
    const profile = v1Profiles?.[profileId];
    return Array.isArray(profile?.cookies) ? (profile.cookies as CookieFixture[]) : [];
};

const getV2ProfileState = (profileId: string) => v2Profiles?.[profileId]?.gameState;

const buildSeedSummary = (
    profileId: string,
    profileLabel: string,
    cookies: CookieFixture[],
    localStorageKeys: string[]
): LegacySeedSummary => ({
    profileId,
    profileLabel,
    cookiesWritten: cookies.map(({ name }) => name),
    localStorageKeysWritten: localStorageKeys,
});

export const seedLegacyV1Profile = (profileId: string): LegacySeedSummary => {
    if (!isBrowser) {
        throw new Error('Legacy save seeding requires a browser environment.');
    }

    const profile = LEGACY_V1_SEED_PROFILES.find((entry) => entry.id === profileId);
    if (!profile) {
        throw new Error(`Unknown v1 seed profile: ${profileId}`);
    }

    const cookies = getV1ProfileCookies(profileId);
    if (!cookies.length) {
        throw new Error('No legacy v1 cookies are available to seed.');
    }

    cookies.forEach(({ name, value, encodeValue = true }) => writeCookie(name, value, encodeValue));

    const localStorageEntries = V1_LOCAL_STORAGE_PROFILES[profileId] ?? [];
    localStorageEntries.forEach(({ key, value }) => {
        localStorage.setItem(key, String(value));
    });

    return buildSeedSummary(
        profileId,
        profile.label,
        cookies,
        localStorageEntries.map(({ key }) => key)
    );
};

export const seedLegacyV2Profile = (profileId: string): LegacySeedSummary => {
    if (!isBrowser) {
        throw new Error('Legacy save seeding requires a browser environment.');
    }

    const profile = LEGACY_V2_SEED_PROFILES.find((entry) => entry.id === profileId);
    if (!profile) {
        throw new Error(`Unknown v2 seed profile: ${profileId}`);
    }

    const state = getV2ProfileState(profileId);
    if (!state || typeof state !== 'object') {
        throw new Error('No legacy v2 localStorage state is available to seed.');
    }

    const serialized = JSON.stringify(state);
    localStorage.setItem('gameState', serialized);
    localStorage.removeItem('gameStateBackup');

    return buildSeedSummary(profileId, profile.label, [], ['gameState']);
};

export const clearLegacyV1CookieSave = (): void => {
    if (!isBrowser) return;
    const cookieNames = new Set<string>();
    Object.keys(v1Profiles || {}).forEach((profileId) => {
        getV1ProfileCookies(profileId).forEach(({ name }) => cookieNames.add(name));
    });
    cookieNames.forEach((name) => expireCookie(name));
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
