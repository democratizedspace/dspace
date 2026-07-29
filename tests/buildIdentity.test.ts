import { describe, expect, it } from 'vitest';
import {
    isFullRevision,
    isPlaceholderRevision,
    normalizeBuildIdentity,
} from '../frontend/src/utils/buildIdentity.js';

const revision = '0123456789abcdef0123456789abcdef01234567';
const base = { version: '3.1.0', gitSha: revision, generatedAt: '2026-07-29T12:00:00Z' };

describe('canonical build identity', () => {
    it('derives full and short revisions and accepts an agreeing immutable image', () => {
        expect(
            normalizeBuildIdentity({
                ...base,
                image: 'ghcr.io/democratizedspace/dspace:main-0123456',
            })
        ).toEqual({
            version: '3.1.0',
            revision,
            shortRevision: '0123456',
            builtAt: base.generatedAt,
            image: 'ghcr.io/democratizedspace/dspace:main-0123456',
        });
    });

    it.each(['', 'unknown', 'missing', 'missing-sha', 'dev-local', '0123456', `${revision}0`])(
        'rejects invalid production revision %j',
        (gitSha) => expect(() => normalizeBuildIdentity({ ...base, gitSha })).toThrow()
    );

    it.each([
        'ghcr.io/democratizedspace/dspace:latest',
        'ghcr.io/democratizedspace/dspace:v3.1.0',
        'ghcr.io/democratizedspace/dspace:main-abcdef0',
        'unbounded',
    ])('rejects movable or mismatched image coordinate %s', (image) =>
        expect(() => normalizeBuildIdentity({ ...base, image })).toThrow()
    );

    it('preserves an explicit local-only path', () => {
        expect(
            normalizeBuildIdentity({ ...base, gitSha: 'dev-local' }, { allowLocal: true })
                .shortRevision
        ).toBe('dev-local');
    });

    it('recognizes full revisions and placeholders', () => {
        expect(isFullRevision(revision)).toBe(true);
        expect(isFullRevision('0123456')).toBe(false);
        expect(isPlaceholderRevision('missing-sha')).toBe(true);
    });
});
