import { describe, expect, it } from 'vitest';

import { searchDocsRag } from '../frontend/src/utils/docsRag.js';

describe('Docs RAG routes catalog', () => {
    it('returns the canonical routes table for custom content backup', async () => {
        const result = await searchDocsRag(
            'What is the canonical route for custom content backup?'
        );

        const sourceUrls = result.sources
            .map((source) => source.url || source.id || '')
            .filter(Boolean);

        expect(sourceUrls.some((url) => url.startsWith('/docs/routes'))).toBe(true);
        expect(result.excerptsText).toContain('/contentbackup');
    });
});
