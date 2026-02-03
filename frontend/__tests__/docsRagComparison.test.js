import { describe, expect, it } from 'vitest';

import { getDocsRagComparison, getDocsRagMismatchWarning } from '../src/utils/docsRag.js';

describe('docsRag comparison', () => {
    it('reports assumed status when app SHA is missing but docs SHA exists', () => {
        const comparison = getDocsRagComparison('dev-local', 'abc123');
        expect(comparison.status).toBe('assumed');
        expect(comparison.message).toContain('app SHA missing');
        expect(getDocsRagMismatchWarning('dev-local', 'abc123')).toBeNull();
    });

    it('reports mismatches only when both SHAs are real', () => {
        const comparison = getDocsRagComparison('abc123', 'def456');
        expect(comparison.status).toBe('mismatch');
        expect(getDocsRagMismatchWarning('abc123', 'def456')).toContain('mismatch');
    });
});
