import { describe, expect, it } from 'vitest';
import { searchDocsRag } from '../frontend/src/utils/docsRag.js';

describe('docs RAG drift intent', () => {
    it('forces v3 release state source for drift queries', async () => {
        const result = await searchDocsRag('what v2-only mechanics were removed in v3');
        const hasReleaseState = result.sources.some((source) =>
            String(source.url || '').startsWith('/docs/v3-release-state')
        );
        expect(hasReleaseState).toBe(true);
    });
});
