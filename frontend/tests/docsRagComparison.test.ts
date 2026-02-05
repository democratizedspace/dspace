import { describe, expect, it } from 'vitest';
import { getDocsRagComparison, getDocsRagMismatchWarning } from '../src/utils/docsRag.js';

describe('docs RAG comparison', () => {
    it('does not emit mismatch warning when app SHA is missing', () => {
        const comparison = getDocsRagComparison('dev-local', 'abc123');

        expect(comparison.status).toBe('unverified');
        expect(comparison.message).toBe('⚠️ cannot verify app/docs sync (app SHA missing)');
        expect(getDocsRagMismatchWarning('dev-local', 'abc123')).toBeNull();
    });

    it('reports missing docs SHA when docs data is unavailable', () => {
        const comparison = getDocsRagComparison('abc123', 'unknown');

        expect(comparison.status).toBe('unverified');
        expect(comparison.message).toBe('⚠️ cannot verify app/docs sync (app SHA missing)');
    });

    it('flags mismatches only when both SHAs are available', () => {
        const comparison = getDocsRagComparison('abc123', 'def456');

        expect(comparison.status).toBe('mismatch');
        expect(comparison.message).toContain('⚠️');
        expect(getDocsRagMismatchWarning('abc123', 'def456')).toBe(comparison.message);
    });

    it('treats docs-pack-fallback as non-real for sync checks', () => {
        const comparison = getDocsRagComparison('docs-pack-fallback', 'abc123');

        expect(comparison.status).toBe('unverified');
        expect(comparison.message).toBe('⚠️ cannot verify app/docs sync (app SHA missing)');
    });

    it('reports in-sync when SHAs match exactly', () => {
        const comparison = getDocsRagComparison('abc123', 'abc123');

        expect(comparison.status).toBe('match');
        expect(comparison.message).toBe('✅ in sync');
    });
});
