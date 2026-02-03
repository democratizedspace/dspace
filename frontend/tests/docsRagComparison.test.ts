import { describe, expect, it } from 'vitest';

import { getDocsRagComparison, getDocsRagMismatchWarning } from '../src/utils/docsRag.js';

describe('docs RAG comparison', () => {
    it('does not warn when app SHA is missing and docs SHA is used for display', () => {
        const comparison = getDocsRagComparison('missing-sha', 'docs789', {
            appShaSource: 'docs-pack-fallback',
        });

        expect(comparison.status).toBe('unavailable');
        expect(comparison.message).toContain('using docs pack SHA for display');
        expect(getDocsRagMismatchWarning('missing-sha', 'docs789', {
            appShaSource: 'docs-pack-fallback',
        })).toBeNull();
    });
});
