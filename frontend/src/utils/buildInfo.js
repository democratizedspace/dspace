const readViteGitSha = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GIT_SHA) {
        return import.meta.env.VITE_GIT_SHA;
    }
    if (typeof process !== 'undefined' && process.env?.VITE_GIT_SHA) {
        return process.env.VITE_GIT_SHA;
    }
    return undefined;
};

const isProductionBuild = () => {
    if (typeof import.meta !== 'undefined' && typeof import.meta.env?.PROD === 'boolean') {
        return import.meta.env.PROD;
    }
    if (typeof import.meta !== 'undefined' && import.meta.env?.MODE) {
        return import.meta.env.MODE === 'production';
    }
    if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
        return process.env.NODE_ENV === 'production';
    }
    return false;
};

export const getAppGitSha = () => {
    const rawSha = readViteGitSha();
    const normalized = String(rawSha || '').trim();
    return normalized || 'unknown';
};

export const getPromptVersionSha = () => {
    const rawSha = readViteGitSha();
    const normalized = String(rawSha || '').trim();
    if (normalized) {
        return normalized;
    }
    return isProductionBuild() ? 'unknown' : 'dev';
};
