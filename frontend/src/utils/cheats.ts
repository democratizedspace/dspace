const ALLOWED_ENVIRONMENTS = new Set(['dev', 'development', 'staging']);

const normalizeEnvironment = (value: string | undefined | null): string =>
    (value ?? '').trim().toLowerCase();

export const isCheatsAvailable = (environment = process.env.DSPACE_ENV): boolean => {
    const normalized = normalizeEnvironment(environment);

    if (!normalized) return false;
    if (normalized === 'prod' || normalized === 'production') return false;

    return ALLOWED_ENVIRONMENTS.has(normalized);
};

export const __testUtils = {
    normalizeEnvironment,
};
