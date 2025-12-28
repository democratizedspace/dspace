import { writable } from 'svelte/store';
import { isBrowser } from '../utils/ssr.js';

export const QA_CHEATS_STORAGE_KEY = 'qaCheatsEnabled';

export const qaCheatsEnabled = writable(false);

let storageListenerAttached = false;
let initializationCount = 0;
let latestCheatsAvailability = false;

const readPreference = (): boolean => {
    if (!isBrowser) return false;

    try {
        return localStorage.getItem(QA_CHEATS_STORAGE_KEY) === 'true';
    } catch (error) {
        console.warn('Unable to read QA cheats preference:', error);
        return false;
    }
};

const persistPreference = (enabled: boolean): void => {
    if (!isBrowser) return;

    try {
        localStorage.setItem(QA_CHEATS_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch (error) {
        console.warn('Unable to persist QA cheats preference:', error);
    }
};

export const getRuntimeCheatsAvailability = (): boolean => {
    if (typeof globalThis === 'undefined') return false;

    const runtime = (globalThis as unknown as { __DSPACE_RUNTIME__?: Record<string, unknown> })
        .__DSPACE_RUNTIME__;

    return runtime?.cheatsAvailable === true;
};

const onStorage = (event: StorageEvent) => {
    if (event.key !== QA_CHEATS_STORAGE_KEY) return;

    const persistedValue = event.newValue === 'true';
    qaCheatsEnabled.set(latestCheatsAvailability && persistedValue);
};

export const initializeQaCheats = (
    cheatsAvailable = getRuntimeCheatsAvailability()
): (() => void) => {
    latestCheatsAvailability = Boolean(cheatsAvailable);
    qaCheatsEnabled.set(latestCheatsAvailability && readPreference());

    if (!isBrowser) return () => {};

    initializationCount += 1;

    if (!storageListenerAttached) {
        window.addEventListener('storage', onStorage);
        storageListenerAttached = true;
    }

    return () => {
        if (!isBrowser) return;

        initializationCount = Math.max(0, initializationCount - 1);
        if (initializationCount === 0 && storageListenerAttached) {
            window.removeEventListener('storage', onStorage);
            storageListenerAttached = false;
        }
    };
};

export const setQaCheatsEnabled = (
    enabled: boolean,
    cheatsAvailable = getRuntimeCheatsAvailability()
): boolean => {
    latestCheatsAvailability = Boolean(cheatsAvailable);
    const nextValue = latestCheatsAvailability && Boolean(enabled);

    qaCheatsEnabled.set(nextValue);
    persistPreference(nextValue);

    return nextValue;
};

export const readQaCheatsPreference = (): boolean => readPreference();
