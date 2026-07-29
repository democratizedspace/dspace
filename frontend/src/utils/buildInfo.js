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
const FULL_SHA = /^[0-9a-f]{40}$/i;

export const normalizeBuildIdentity = (value) => {
    if (!value || typeof value !== 'object') throw new Error('Build identity is missing.');
    const revision = normalizeSha(value.revision || value.gitSha);
    if (isPlaceholderSha(revision) || !FULL_SHA.test(revision)) {
        throw new Error('Build revision must be a full 40-character hexadecimal SHA.');
    }
    const version = String(value.version || '').trim();
    if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
        throw new Error('Build version is invalid.');
    }
    const generatedAt = String(value.generatedAt || '').trim();
    if (!generatedAt || Number.isNaN(Date.parse(generatedAt))) {
        throw new Error('Build timestamp is invalid.');
    }
    const shortRevision = revision.slice(0, 7);
    if (value.shortRevision && value.shortRevision !== shortRevision) {
        throw new Error('Short revision does not match full revision.');
    }
    const identity = { version, revision, shortRevision, generatedAt };
    if (value.image) {
        const image = String(value.image).trim();
        const escaped = shortRevision.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (
            !new RegExp(`^[a-z0-9.-]+(?:/[a-z0-9._-]+)+:[a-z0-9._-]+-${escaped}$`, 'i').test(image)
        ) {
            throw new Error('Image coordinate is not an immutable matching branch-SHA tag.');
        }
        identity.image = image;
    }
    return identity;
};

export const getCanonicalBuildIdentity = () => normalizeBuildIdentity(buildMeta);

const readBuildMetaSha = () => normalizeSha(buildMeta?.gitSha);

const readBuildMetaGeneratedAt = () => normalizeSha(buildMeta?.generatedAt);

const readBuildMetaSource = () => normalizeSha(buildMeta?.source);

export const isPlaceholderSha = (value) => {
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

const isPlaceholderSource = (value) => {
    const normalized = normalizeSha(value);
    if (!normalized) {
        return true;
    }
    const lower = normalized.toLowerCase();
    return lower === 'unknown' || lower === 'static';
};

const isBuildMetaUsable = () => {
    const buildMetaSha = readBuildMetaSha();
    if (isPlaceholderSha(buildMetaSha)) {
        return false;
    }
    if (!readBuildMetaGeneratedAt()) {
        return false;
    }
    const buildMetaSource = readBuildMetaSource();
    return !isPlaceholderSource(buildMetaSource);
};

const resolveGitSha = () => {
    const normalized = normalizeSha(readViteGitSha());
    if (!isPlaceholderSha(normalized)) {
        return normalized;
    }
    if (isBuildMetaUsable()) {
        return readBuildMetaSha();
    }
    return 'missing';
};

const shortenSha = (value) => {
    const normalized = normalizeSha(value);
    if (!normalized || normalized === 'missing' || normalized === 'dev-local') {
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
    if (isBuildMetaUsable()) {
        return { sha: readBuildMetaSha(), source: readBuildMetaSource() || 'build-meta' };
    }
    const fallbackNormalized = normalizeSha(fallbackSha);
    if (!isPlaceholderSha(fallbackNormalized)) {
        return { sha: fallbackNormalized, source: 'docs-pack-fallback' };
    }
    return { sha: 'missing', source: 'missing' };
};

export const getPromptVersionLabelForSha = (sha) => {
    const shortSha = shortenSha(sha);
    return `v3:${shortSha || 'missing'}`;
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
