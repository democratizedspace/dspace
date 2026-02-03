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

const isPlaceholderSha = (value) => {
    const normalized = normalizeSha(value).toLowerCase();
    return !normalized || normalized === 'unknown' || normalized === 'dev-local';
};

const resolveGitSha = () => {
    const normalized = normalizeSha(readViteGitSha());
    if (isPlaceholderSha(normalized)) {
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

export const getAppGitShaWithFallback = (fallbackSha) => {
    const viteSha = normalizeSha(readViteGitSha());
    if (!isPlaceholderSha(viteSha)) {
        return { sha: viteSha, source: 'vite' };
    }
    const fallback = normalizeSha(fallbackSha);
    if (!isPlaceholderSha(fallback)) {
        return { sha: fallback, source: 'docs-pack-fallback' };
    }
    return { sha: 'dev-local', source: 'dev-local' };
};

const extractPromptVersionSha = (promptVersionLabel) => {
    const normalized = normalizeSha(promptVersionLabel);
    if (!normalized) {
        return '';
    }
    const parts = normalized.split(':').filter(Boolean);
    if (parts.length === 0) {
        return '';
    }
    return parts[parts.length - 1];
};

export const getPromptVersionSha = (promptVersionLabel) => {
    if (promptVersionLabel) {
        return shortenSha(extractPromptVersionSha(promptVersionLabel));
    }
    return shortenSha(resolveGitSha());
};

export const getPromptVersionLabelForSha = (sha) => `v3:${shortenSha(sha)}`;

export const getPromptVersionLabel = () => `v3:${getPromptVersionSha()}`;
