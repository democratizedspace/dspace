import { isBrowser } from './ssr.js';
import v1Fixture from './legacySaveFixtures/legacy_v1_cookie_save.json' assert { type: 'json' };
import v2Fixture from './legacySaveFixtures/legacy_v2_localstorage_save.json' assert { type: 'json' };
import { LEGACY_V2_SEED_SKIP_KEY, LEGACY_V2_STORAGE_KEYS } from './legacySaveParsing.js';
import { LEGACY_V1_ITEM_MAPPINGS } from './legacyV1ItemIdMap.js';

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

type LegacyV1SeedItem = {
    v1Id: number;
    v1Name: string;
    v3Id: string;
    v3Name: string;
};

type LegacyV2SeedItem = {
    v2Id: string;
    v2Name: string;
    v3Id: string;
    v3Name: string;
    count: number | string;
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

const buildLegacyV1SeedItems = (profileId: string): LegacyV1SeedItem[] => {
    const profiles = getV1Profiles();
    const profile = profiles?.[profileId];
    const cookies = Array.isArray(profile?.cookies) ? (profile.cookies as CookieFixture[]) : [];
    const itemIds = new Set<number>();
    cookies.forEach(({ name }) => {
        if (typeof name !== 'string' || !name.startsWith('item-')) return;
        const rawId = Number(name.replace('item-', ''));
        if (!Number.isNaN(rawId)) {
            itemIds.add(rawId);
        }
    });

    return Array.from(itemIds)
        .sort((a, b) => a - b)
        .map((id) => {
            const mapping = LEGACY_V1_ITEM_MAPPINGS.find((entry) => entry.v1Id === id);

            return {
                v1Id: id,
                v1Name: mapping?.v1Name ?? `Legacy item ${id}`,
                v3Id: mapping?.v3Id ?? 'UNMAPPED',
                v3Name: mapping?.v3Name ?? 'UNMAPPED',
            };
        });
};

export const getLegacyV1SeedItems = (profileId = 'minimal'): LegacyV1SeedItem[] =>
    buildLegacyV1SeedItems(profileId);

const buildLegacyV2SeedItems = (profileId: string): LegacyV2SeedItem[] => {
    const profiles = getV2Profiles();
    const profile = profiles?.[profileId];
    const inventory =
        profile?.gameState && typeof profile.gameState === 'object'
            ? profile.gameState.inventory
            : undefined;
    if (!inventory || typeof inventory !== 'object') return [];

    const entries = Object.entries(inventory)
        .filter(([id]) => id)
        .map(([id, count]) => {
            const numericId = Number(id);
            const mapping = Number.isNaN(numericId)
                ? undefined
                : LEGACY_V1_ITEM_MAPPINGS.find((entry) => entry.v1Id === numericId);

            return {
                v2Id: id,
                v2Name: mapping?.v1Name ?? `Legacy item ${id}`,
                v3Id: mapping?.v3Id ?? 'UNMAPPED',
                v3Name: mapping?.v3Name ?? 'UNMAPPED',
                count: typeof count === 'number' ? count : String(count),
            };
        });

    return entries.sort((a, b) => {
        const aNumeric = Number(a.v2Id);
        const bNumeric = Number(b.v2Id);
        const aIsNumeric = !Number.isNaN(aNumeric);
        const bIsNumeric = !Number.isNaN(bNumeric);
        if (aIsNumeric && bIsNumeric) return aNumeric - bNumeric;
        if (aIsNumeric) return -1;
        if (bIsNumeric) return 1;
        return a.v2Id.localeCompare(b.v2Id);
    });
};

export const getLegacyV2SeedItems = (profileId = 'minimal'): LegacyV2SeedItem[] =>
    buildLegacyV2SeedItems(profileId);

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
    localStorage.removeItem(LEGACY_V2_SEED_SKIP_KEY);

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
