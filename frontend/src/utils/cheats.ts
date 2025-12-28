import { isBrowser } from './ssr.js';

export const QA_CHEATS_STORAGE_KEY = 'qaCheatsEnabled';

const CHEATS_ENV_ALLOWLIST = ['dev', 'development', 'staging'];

export function isCheatsAvailable(envValue: string | undefined | null = process.env.DSPACE_ENV) {
    if (!envValue) return false;

    const normalized = String(envValue).trim().toLowerCase();
    return CHEATS_ENV_ALLOWLIST.includes(normalized);
}

export function readCheatsEnabled(): boolean {
    if (!isBrowser) return false;

    try {
        return localStorage.getItem(QA_CHEATS_STORAGE_KEY) === 'true';
    } catch (error) {
        console.warn('Unable to read QA cheats preference:', error);
        return false;
    }
}

export function persistCheatsEnabled(enabled: boolean): void {
    if (!isBrowser) return;

    try {
        localStorage.setItem(QA_CHEATS_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch (error) {
        console.warn('Unable to persist QA cheats preference:', error);
    }
}

export function getRuntimeCheatsAvailability(): boolean {
    if (!isBrowser) return false;

    const runtime = (
        window as typeof window & { __DSPACE_RUNTIME__?: { cheatsAvailable?: boolean } }
    ).__DSPACE_RUNTIME__;

    return runtime?.cheatsAvailable === true;
}

export function resolveCheatsEnabled(available: boolean): boolean {
    if (!available) return false;
    return readCheatsEnabled();
}
