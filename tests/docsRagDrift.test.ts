import { describe, expect, it } from 'vitest';
import { searchDocsRag } from '../frontend/src/utils/docsRag.js';

describe('docs RAG drift intent', () => {
    it('forces v3 release state doc for v2-only drift queries', async () => {
        const { sources } = await searchDocsRag(
            'what v2-only mechanics were removed in v3',
            {
                maxResults: 6,
                maxChars: 4000,
            }
        );

        const hasReleaseState = sources.some((entry) =>
            String(entry.url || '').startsWith('/docs/v3-release-state')
        );

        expect(hasReleaseState).toBe(true);
    });
});
