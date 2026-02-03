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
const isMissingSha = (value) => {
    const normalized = normalizeSha(value);
    if (!normalized) {
        return true;
    }
    const lower = normalized.toLowerCase();
    return lower === 'unknown' || lower === 'dev-local' || lower === 'missing-sha';
};

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

export const getAppGitShaWithFallback = (fallbackSha) => {
    const viteSha = normalizeSha(readViteGitSha());
    if (!isMissingSha(viteSha)) {
        return { sha: viteSha, source: 'vite' };
    }

    const fallbackNormalized = normalizeSha(fallbackSha);
    if (!isMissingSha(fallbackNormalized)) {
        return { sha: fallbackNormalized, source: 'docs-pack-fallback' };
    }

    return { sha: 'dev-local', source: 'dev-local' };
};

export const deriveEnvNameFromHostname = (hostname) => {
    const normalized = String(hostname || '').trim().toLowerCase();
    if (!normalized) {
        return 'dev';
    }
    const host = normalized.split(':')[0];
    if (host.startsWith('staging.')) {
        return 'staging';
    }
    if (host === 'democratized.space' || host.endsWith('.democratized.space')) {
        return 'prod';
    }
    return 'dev';
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

export const getPromptVersionLabel = () => `v3:${getPromptVersionSha()}`;
