import { describe, expect, it } from 'vitest';
import { getDocsRagComparison, getDocsRagMismatchWarning } from '../src/utils/docsRag.js';

describe('docs RAG comparison', () => {
    it('does not emit mismatch warning when app SHA is missing', () => {
        const comparison = getDocsRagComparison('dev-local', 'abc123');

        expect(comparison.status).toBe('assumed');
        expect(comparison.message).toContain('app SHA missing');
        expect(getDocsRagMismatchWarning('dev-local', 'abc123')).toBeNull();
    });

    it('cannot verify sync in staging when app SHA is missing', () => {
        const comparison = getDocsRagComparison('dev-local', 'abc123', {
            envName: 'staging',
            appShaIsReal: false,
        });

        expect(comparison).toEqual({
            status: 'unavailable',
            message: '⚠️ cannot verify app/docs sync (app SHA missing)',
        });
        expect(
            getDocsRagMismatchWarning('dev-local', 'abc123', {
                envName: 'staging',
                appShaIsReal: false,
            })
        ).toBeNull();
    });

    it('confirms sync in prod when both SHAs are real and match', () => {
        const comparison = getDocsRagComparison('abc123', 'abc123', {
            envName: 'prod',
            appShaIsReal: true,
        });

        expect(comparison).toEqual({
            status: 'match',
            message: '✅ in sync (app: abc123, docs: abc123)',
        });
    });

    it('flags mismatches only when both SHAs are available', () => {
        const comparison = getDocsRagComparison('abc123', 'def456');

        expect(comparison.status).toBe('mismatch');
        expect(comparison.message).toContain('⚠️');
        expect(getDocsRagMismatchWarning('abc123', 'def456')).toBe(comparison.message);
    });
});
