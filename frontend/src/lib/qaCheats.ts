import { derived, writable } from 'svelte/store';
import { isBrowser } from '../utils/ssr.js';

export const QA_CHEATS_STORAGE_KEY = 'qaCheatsEnabled';

const readAvailabilityFromDom = (): boolean => {
    if (!isBrowser) return false;
    return document.documentElement.dataset.cheatsAvailable === 'true';
};

const readStoredPreference = (): boolean => {
    if (!isBrowser) return false;

    try {
        const stored = localStorage.getItem(QA_CHEATS_STORAGE_KEY);
        return stored === 'true';
    } catch (error) {
        console.warn('Unable to read QA cheats preference', error);
        return false;
    }
};

const persistPreference = (enabled: boolean) => {
    if (!isBrowser) return;

    try {
        localStorage.setItem(QA_CHEATS_STORAGE_KEY, String(enabled));
    } catch (error) {
        console.warn('Unable to persist QA cheats preference', error);
    }
};

const initialAvailability = readAvailabilityFromDom();
const availabilityStore = writable(initialAvailability);
const preferenceStore = writable(initialAvailability ? readStoredPreference() : false);

let currentAvailability = initialAvailability;

availabilityStore.subscribe((available) => {
    currentAvailability = available;

    if (!available) {
        preferenceStore.set(false);
    }
});

export const qaCheatsAvailability = {
    subscribe: availabilityStore.subscribe,
};

export const qaCheatsPreference = {
    subscribe: preferenceStore.subscribe,
};

export const qaCheatsEnabled = derived(
    [availabilityStore, preferenceStore],
    ([$availability, $preference]) => Boolean($availability && $preference)
);

export const initializeQaCheats = (available?: boolean): void => {
    const normalized =
        typeof available === 'boolean' ? Boolean(available) : readAvailabilityFromDom();

    availabilityStore.set(normalized);
    currentAvailability = normalized;

    if (normalized) {
        preferenceStore.set(readStoredPreference());
    } else {
        preferenceStore.set(false);
    }
};

export const setQaCheatsPreference = (enabled: boolean): void => {
    const normalized = Boolean(enabled);
    const effective = normalized && currentAvailability;

    preferenceStore.set(effective);
    persistPreference(normalized);
};
