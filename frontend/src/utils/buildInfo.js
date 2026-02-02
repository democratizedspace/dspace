const readViteGitSha = () => {
    const metaSha =
        typeof import.meta !== 'undefined' && import.meta.env?.VITE_GIT_SHA
            ? import.meta.env.VITE_GIT_SHA
            : undefined;
    const processSha =
        typeof process !== 'undefined' && process.env?.VITE_GIT_SHA
            ? process.env.VITE_GIT_SHA
            : undefined;
    const normalized = String(metaSha ?? processSha ?? '').trim();
    return normalized || undefined;
};

const isProductionBuild = () => {
    if (typeof import.meta !== 'undefined' && typeof import.meta.env?.PROD === 'boolean') {
        return import.meta.env.PROD;
    }
    if (typeof process !== 'undefined') {
        const env = process.env ?? {};
        if (env.NODE_ENV) {
            return env.NODE_ENV === 'production';
        }
        if (env.VITE_ENV) {
            return env.VITE_ENV === 'production';
        }
        if (env.VITE_BUILD_MODE) {
            return env.VITE_BUILD_MODE === 'production';
        }
    }
    return false;
};

export const getAppGitSha = () => {
    const rawSha = readViteGitSha();
    return rawSha ?? 'unknown';
};

export const getPromptVersionSha = () => {
    const rawSha = readViteGitSha();
    if (rawSha) {
        return rawSha;
    }
    return isProductionBuild() ? 'unknown' : 'dev';
};
