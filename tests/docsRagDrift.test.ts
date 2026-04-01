import { describe, it, expect } from 'vitest';
import { searchDocsRag } from '../frontend/src/utils/docsRag.js';

describe('docs RAG drift intent', () => {
    it('forces the v3 release state doc for v2-only drift queries', async () => {
        const result = await searchDocsRag('what v2-only mechanics were removed in v3');
        const hasReleaseState = result.sources.some(
            (source) =>
                source?.id?.startsWith('doc:/docs/v3-release-state#') ||
                source?.url?.startsWith('/docs/v3-release-state#')
        );

        expect(hasReleaseState).toBe(true);
    });

    it('forces the v3 release state doc for v2 to v3 drift phrasing', async () => {
        const result = await searchDocsRag('v2 to v3 behavior drift for chat provider changes');
        const hasReleaseState = result.sources.some(
            (source) =>
                source?.id?.startsWith('doc:/docs/v3-release-state#') ||
                source?.url?.startsWith('/docs/v3-release-state#')
        );

        expect(hasReleaseState).toBe(true);
    });
});
