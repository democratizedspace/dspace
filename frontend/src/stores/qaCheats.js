import { derived, writable } from 'svelte/store';
import { isBrowser } from '../utils/ssr.js';

const STORAGE_KEY = 'qaCheatsEnabled';

const cheatsAvailableStore = writable(false);
const cheatPreferenceStore = writable(false);

const readStoredPreference = () => {
    if (!isBrowser) return false;

    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (error) {
        console.warn('Unable to read QA cheats preference:', error);
        return false;
    }
};

const persistPreference = (enabled) => {
    if (!isBrowser) return;

    try {
        localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch (error) {
        console.warn('Unable to persist QA cheats preference:', error);
    }
};

export const qaCheatsActive = derived(
    [cheatsAvailableStore, cheatPreferenceStore],
    ([$available, $enabled]) => $available && $enabled
);

export const qaCheatsAvailability = derived(cheatsAvailableStore, ($available) => $available);
export const qaCheatsPreference = derived(cheatPreferenceStore, ($enabled) => $enabled);

export const hydrateQaCheatsPreference = (cheatsAvailable) => {
    const available = Boolean(cheatsAvailable);
    cheatsAvailableStore.set(available);

    if (!available) {
        cheatPreferenceStore.set(false);
        return false;
    }

    const stored = readStoredPreference();
    cheatPreferenceStore.set(stored);
    return stored;
};

export const updateQaCheatsEnabled = (enabled) => {
    const nextEnabled = Boolean(enabled);
    cheatPreferenceStore.set(nextEnabled);
    persistPreference(nextEnabled);
};
