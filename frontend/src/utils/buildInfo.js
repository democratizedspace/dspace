const FALLBACK_SHA = 'dev-local';

const normalizeSha = (value) => String(value || '').trim();

const readViteGitSha = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GIT_SHA) {
        return import.meta.env.VITE_GIT_SHA;
    }
    if (typeof process !== 'undefined' && process.env?.VITE_GIT_SHA) {
        return process.env.VITE_GIT_SHA;
    }
    return undefined;
};

export const getAppGitSha = () => {
    const normalized = normalizeSha(readViteGitSha());
    return normalized || FALLBACK_SHA;
};

export const getPromptVersionSha = () => {
    return getAppGitSha();
};
