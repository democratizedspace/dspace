import buildMeta from '../generated/build_meta.json';

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
    const normalized = normalizeSha(value);
    if (!normalized) {
        return true;
    }
    const lower = normalized.toLowerCase();
    return (
        lower === 'unknown' ||
        lower === 'dev-local' ||
        lower === 'missing' ||
        lower === 'missing-sha'
    );
};

const readBuildMetaSha = () => normalizeSha(buildMeta?.gitSha);

const resolveGitSha = () => {
    const normalized = normalizeSha(readViteGitSha());
    if (!isPlaceholderSha(normalized)) {
        return normalized;
    }
    const buildMetaSha = readBuildMetaSha();
    if (!isPlaceholderSha(buildMetaSha)) {
        return buildMetaSha;
    }
    return 'missing';
};

const shortenSha = (value) => {
    const normalized = normalizeSha(value);
    if (!normalized || normalized === 'dev-local' || normalized === 'missing') {
        return normalized;
    }
    return normalized.length > 7 ? normalized.slice(0, 7) : normalized;
};

export const getAppGitSha = () => resolveGitSha();

export const getAppGitShaWithFallback = (fallbackSha) => {
    const appSha = normalizeSha(readViteGitSha());
    if (!isPlaceholderSha(appSha)) {
        return { sha: appSha, source: 'vite' };
    }
    const buildMetaSha = readBuildMetaSha();
    if (!isPlaceholderSha(buildMetaSha)) {
        return { sha: buildMetaSha, source: 'vite' };
    }
    const fallbackNormalized = normalizeSha(fallbackSha);
    if (!isPlaceholderSha(fallbackNormalized)) {
        return { sha: fallbackNormalized, source: 'docs-pack-fallback' };
    }
    return { sha: 'missing', source: 'missing' };
};

export const getPromptVersionLabelForSha = (sha) => {
    const shortSha = shortenSha(sha);
    return `v3:${shortSha || 'dev-local'}`;
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

export const deriveEnvNameFromHostname = (hostname) => {
    const normalized = String(hostname || '')
        .trim()
        .toLowerCase();
    const host = normalized.split(':')[0];
    if (host === 'staging.democratized.space') {
        return 'staging';
    }
    if (host === 'democratized.space') {
        return 'prod';
    }
    return 'dev';
};
