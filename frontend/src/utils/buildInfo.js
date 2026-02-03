const readViteGitSha = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GIT_SHA) {
        return import.meta.env.VITE_GIT_SHA;
    }
    if (typeof process !== 'undefined' && process.env?.VITE_GIT_SHA) {
        return process.env.VITE_GIT_SHA;
    }
    return undefined;
};

const normalizeSha = (value) => String(value || '').trim();

const resolveGitSha = () => {
    const normalized = normalizeSha(readViteGitSha());
    if (!normalized || normalized.toLowerCase() === 'unknown') {
        return 'dev-local';
    }
    return normalized;
};

const shortenSha = (value) => {
    const normalized = normalizeSha(value);
    if (!normalized || normalized === 'dev-local') {
        return normalized;
    }
    return normalized.length > 7 ? normalized.slice(0, 7) : normalized;
};

export const getAppGitSha = () => resolveGitSha();

export const getPromptVersionSha = () => shortenSha(resolveGitSha());
