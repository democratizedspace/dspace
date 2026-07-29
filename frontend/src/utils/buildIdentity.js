const FULL_REVISION = /^[0-9a-f]{40}$/;
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const PLACEHOLDERS = new Set(['unknown', 'missing', 'missing-sha', 'dev-local']);
const IMMUTABLE_IMAGE =
    /^ghcr\.io\/democratizedspace\/dspace:([a-z0-9][a-z0-9._-]*)-([0-9a-f]{7})$/;

const bounded = (value, maximum = 160) => {
    const normalized = String(value ?? '').trim();
    return normalized.length <= maximum ? normalized : '';
};

export const isPlaceholderRevision = (value) =>
    PLACEHOLDERS.has(bounded(value).toLowerCase()) || !bounded(value);

/** Normalize the only public build identity. Throws rather than returning partial production data. */
export function normalizeBuildIdentity(meta) {
    if (!meta || typeof meta !== 'object') throw new Error('build metadata is invalid');
    const applicationVersion = bounded(meta.applicationVersion ?? meta.version, 64);
    const revision = bounded(meta.revision ?? meta.gitSha, 40).toLowerCase();
    const builtAt = bounded(meta.builtAt ?? meta.generatedAt, 40);
    const image = bounded(meta.image ?? meta.imageCoordinate, 200);

    if (!VERSION.test(applicationVersion)) throw new Error('application version is invalid');
    if (!FULL_REVISION.test(revision) || isPlaceholderRevision(revision)) {
        throw new Error('revision must be a full 40-character Git SHA');
    }
    const timestamp = new Date(builtAt);
    if (!builtAt || Number.isNaN(timestamp.valueOf()) || timestamp.toISOString() !== builtAt) {
        throw new Error('build timestamp must be an ISO timestamp');
    }
    if (image) {
        const match = image.match(IMMUTABLE_IMAGE);
        if (!match || match[2] !== revision.slice(0, 7) || match[1].endsWith('-latest')) {
            throw new Error('image must be the matching immutable branch-SHA coordinate');
        }
    }
    return {
        applicationVersion,
        revision,
        shortRevision: revision.slice(0, 7),
        builtAt,
        ...(image ? { image } : {}),
    };
}
