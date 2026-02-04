import { describe, expect, it } from 'vitest';
import { getDocsRagComparison, getDocsRagMismatchWarning } from '../src/utils/docsRag.js';

describe('docs RAG comparison', () => {
    it('does not emit mismatch warning when app SHA is missing', () => {
        const comparison = getDocsRagComparison('dev-local', 'abc123');

        expect(comparison.status).toBe('assumed');
        expect(comparison.message).toContain('app SHA missing');
        expect(getDocsRagMismatchWarning('dev-local', 'abc123')).toBeNull();
    });

    it('flags mismatches only when both SHAs are available', () => {
        const comparison = getDocsRagComparison('abc123', 'def456');

        expect(comparison.status).toBe('mismatch');
        expect(comparison.message).toContain('⚠️');
        expect(getDocsRagMismatchWarning('abc123', 'def456')).toBe(comparison.message);
    });

    it('cannot verify sync on staging when app SHA is missing', () => {
        const comparison = getDocsRagComparison('dev-local', 'abc123', {
            envName: 'staging',
            appShaSource: 'missing',
        });

        expect(comparison.status).toBe('unavailable');
        expect(comparison.message).toBe('⚠️ cannot verify app/docs sync (app SHA missing)');
    });

    it('reports in sync only when staging SHAs are real and match', () => {
        const comparison = getDocsRagComparison('abc123def456', 'abc123', {
            envName: 'staging',
            appShaSource: 'vite',
        });

        expect(comparison.status).toBe('match');
        expect(comparison.message).toContain('✅ in sync');
    });
});
