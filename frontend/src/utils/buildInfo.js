const FALLBACK_SHA = 'dev-local';

const readViteGitSha = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GIT_SHA) {
        return import.meta.env.VITE_GIT_SHA;
    }
    if (typeof process !== 'undefined' && process.env?.VITE_GIT_SHA) {
        return process.env.VITE_GIT_SHA;
    }
    return undefined;
};

const normalizeSha = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized || normalized.toLowerCase() === 'unknown') {
        return '';
    }
    return normalized;
};

const getBuildSha = () => {
    const rawSha = readViteGitSha();
    return normalizeSha(rawSha) || FALLBACK_SHA;
};

export const getAppGitSha = () => {
    return getBuildSha();
};

export const getPromptVersionSha = () => {
    return getBuildSha();
};
