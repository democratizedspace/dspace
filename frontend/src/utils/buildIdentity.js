export const FULL_GIT_SHA = /^[0-9a-f]{40}$/i;
const IMMUTABLE_IMAGE =
    /^(?:[a-z0-9.-]+(?::[0-9]+)?\/)?[a-z0-9._/-]+:([a-z0-9._-]+)-([0-9a-f]{7})$/i;
const PLACEHOLDERS = new Set(['', 'unknown', 'missing', 'missing-sha', 'dev-local']);

const boundedString = (value, name, maxLength = 256) => {
    const normalized = String(value ?? '').trim();
    const hasControlCharacter = [...normalized].some((character) => {
        const code = character.codePointAt(0);
        return code < 32 || code === 127;
    });
    if (!normalized || normalized.length > maxLength || hasControlCharacter) {
        throw new Error(`${name} is missing or invalid`);
    }
    return normalized;
};

export const isPlaceholderRevision = (value) =>
    PLACEHOLDERS.has(
        String(value ?? '')
            .trim()
            .toLowerCase()
    );

export function normalizeBuildIdentity(meta) {
    const version = boundedString(meta?.version, 'version', 64);
    if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
        throw new Error('version is not semantic');
    }
    const revision = boundedString(meta?.revision ?? meta?.gitSha, 'revision', 40).toLowerCase();
    if (isPlaceholderRevision(revision) || !FULL_GIT_SHA.test(revision)) {
        throw new Error('revision must be exactly 40 hexadecimal characters');
    }
    const shortRevision = revision.slice(0, 7);
    if (meta?.shortRevision && String(meta.shortRevision).toLowerCase() !== shortRevision) {
        throw new Error('shortRevision does not agree with revision');
    }
    const buildTimestamp = boundedString(
        meta?.buildTimestamp ?? meta?.generatedAt,
        'buildTimestamp',
        40
    );
    if (
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(buildTimestamp) ||
        Number.isNaN(Date.parse(buildTimestamp))
    ) {
        throw new Error('buildTimestamp must be an ISO UTC timestamp');
    }

    const identity = { version, revision, shortRevision, buildTimestamp };
    const image = String(meta?.image ?? '').trim();
    if (image) {
        const match = boundedString(image, 'image', 256).match(IMMUTABLE_IMAGE);
        if (
            !match ||
            match[2].toLowerCase() !== shortRevision ||
            /(?:^|[-_.])latest(?:$|[-_.])/i.test(match[1])
        ) {
            throw new Error('image must be an immutable branch-SHA coordinate matching revision');
        }
        identity.image = image;
    }
    return Object.freeze(identity);
}
