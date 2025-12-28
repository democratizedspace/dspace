import { derived, get, writable } from 'svelte/store';
import {
    getRuntimeCheatsAvailability,
    persistCheatsEnabled,
    readCheatsEnabled,
    resolveCheatsEnabled,
} from '../utils/cheats';
import { isBrowser } from '../utils/ssr.js';

const runtimeAvailability = getRuntimeCheatsAvailability();

const cheatsAvailable = writable(runtimeAvailability);
const cheatsEnabled = writable(resolveCheatsEnabled(runtimeAvailability));

export const effectiveCheatsEnabled = derived(
    [cheatsAvailable, cheatsEnabled],
    ([$cheatsAvailable, $cheatsEnabled]) => $cheatsAvailable && $cheatsEnabled
);

export function setCheatsAvailable(available: boolean) {
    const normalized = Boolean(available);
    cheatsAvailable.set(normalized);

    if (!normalized) {
        cheatsEnabled.set(false);
        return;
    }

    cheatsEnabled.set(resolveCheatsEnabled(normalized));
}

export function setCheatsEnabled(enabled: boolean) {
    const available = get(cheatsAvailable);
    const nextEnabled = available && Boolean(enabled);

    cheatsEnabled.set(nextEnabled);

    if (isBrowser) {
        persistCheatsEnabled(nextEnabled);
    }
}

export { cheatsAvailable, cheatsEnabled };
