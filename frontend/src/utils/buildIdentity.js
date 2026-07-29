const FULL_SHA = /^[0-9a-f]{40}$/i;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const PLACEHOLDERS = new Set(['', 'unknown', 'missing', 'missing-sha', 'dev-local']);

const bounded = (value, max = 200) => {
    const normalized = String(value ?? '').trim();
    return normalized.length <= max ? normalized : '';
};

export const isPlaceholderRevision = (value) => PLACEHOLDERS.has(bounded(value, 40).toLowerCase());

export const isFullRevision = (value) => FULL_SHA.test(bounded(value, 40));

export const normalizeBuildIdentity = (meta, { allowLocal = false } = {}) => {
    if (!meta || typeof meta !== 'object') throw new Error('Build identity is unavailable.');
    const version = bounded(meta.version, 64);
    const revision = bounded(meta.revision ?? meta.gitSha, 40).toLowerCase();
    const builtAt = bounded(meta.builtAt ?? meta.generatedAt, 32);
    const image = bounded(meta.image, 200);

    if (!version || !/^[0-9A-Za-z][0-9A-Za-z.+-]{0,63}$/.test(version)) {
        throw new Error('Build version is invalid.');
    }
    if (!isFullRevision(revision)) {
        if (!(allowLocal && revision === 'dev-local'))
            throw new Error('Build revision is invalid.');
    }
    if (!ISO_TIMESTAMP.test(builtAt) || Number.isNaN(Date.parse(builtAt))) {
        throw new Error('Build timestamp is invalid.');
    }

    if (image) {
        const tag = image.includes(':') ? image.slice(image.lastIndexOf(':') + 1) : image;
        const match = tag.match(/^([a-z0-9](?:[a-z0-9._-]*[a-z0-9])?)-([0-9a-f]{7})$/i);
        if (
            !match ||
            !isFullRevision(revision) ||
            match[2].toLowerCase() !== revision.slice(0, 7)
        ) {
            throw new Error('Build image coordinate is not an agreeing immutable branch-SHA tag.');
        }
    }

    return Object.freeze({
        version,
        revision,
        shortRevision: isFullRevision(revision) ? revision.slice(0, 7) : 'dev-local',
        builtAt,
        ...(image ? { image } : {}),
    });
};
