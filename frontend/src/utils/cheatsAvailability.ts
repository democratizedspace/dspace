const ALLOWED_ENVIRONMENTS = new Set(['dev', 'development', 'staging']);
const DISALLOWED_ENVIRONMENTS = new Set(['prod', 'production']);

const normalize = (value?: string | null): string | null => {
    if (!value) return null;
    const trimmed = value.trim().toLowerCase();
    return trimmed || null;
};

export const isCheatsAvailable = (environment = process.env.DSPACE_ENV): boolean => {
    const normalized = normalize(environment);

    if (!normalized) {
        return false;
    }

    if (DISALLOWED_ENVIRONMENTS.has(normalized)) {
        return false;
    }

    return ALLOWED_ENVIRONMENTS.has(normalized);
};

export const getCheatsAvailabilityFlag = (): boolean => isCheatsAvailable();
