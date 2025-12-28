const ALLOWED_ENVIRONMENTS = ['dev', 'development', 'staging'] as const;

type AllowedEnvironment = (typeof ALLOWED_ENVIRONMENTS)[number];

const normalizeEnv = (envValue?: string | null): string =>
    (envValue ?? '').toString().trim().toLowerCase();

export const isCheatsAvailable = (envValue = process.env.DSPACE_ENV): boolean => {
    const normalized = normalizeEnv(envValue);
    return ALLOWED_ENVIRONMENTS.includes(normalized as AllowedEnvironment);
};

export const cheatsEnvironment = {
    allowed: ALLOWED_ENVIRONMENTS,
    normalize: normalizeEnv,
};
