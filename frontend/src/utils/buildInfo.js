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
    const rawSha = readViteGitSha();
    const normalized = String(rawSha || '').trim();
    return normalized || 'dev-local';
};

export const getPromptVersionSha = () => {
    const rawSha = readViteGitSha();
    const normalized = String(rawSha || '').trim();
    if (normalized) {
        return normalized;
    }
    return 'dev-local';
};
