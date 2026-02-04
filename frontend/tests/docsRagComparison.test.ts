import { describe, expect, it } from 'vitest';
import { getDocsRagComparison, getDocsRagMismatchWarning } from '../src/utils/docsRag.js';

describe('docs RAG comparison', () => {
    it('does not emit mismatch warning when app SHA is missing', () => {
        const comparison = getDocsRagComparison('dev-local', 'abc123', { envName: 'dev' });

        expect(comparison.status).toBe('assumed');
        expect(comparison.message).toContain('dev fallback');
        expect(getDocsRagMismatchWarning('dev-local', 'abc123', { envName: 'dev' })).toBeNull();
    });

    it('flags mismatches only when both SHAs are available', () => {
        const comparison = getDocsRagComparison('abc123', 'def456', { envName: 'dev' });

        expect(comparison.status).toBe('mismatch');
        expect(comparison.message).toContain('⚠️');
        expect(getDocsRagMismatchWarning('abc123', 'def456', { envName: 'dev' })).toBe(
            comparison.message
        );
    });

    it('reports missing app SHA in deployed environments', () => {
        const comparison = getDocsRagComparison('dev-local', 'abc123', { envName: 'staging' });

        expect(comparison.status).toBe('unavailable');
        expect(comparison.message).toBe('⚠️ cannot verify app/docs sync (app SHA missing)');
    });

    it('reports in sync when deployed SHAs match', () => {
        const comparison = getDocsRagComparison('abc123', 'abc123', { envName: 'prod' });

        expect(comparison.status).toBe('match');
        expect(comparison.message).toContain('✅ in sync');
    });
});
