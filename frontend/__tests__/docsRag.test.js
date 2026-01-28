const { describe, test, expect } = require('vitest');
const { searchDocsRag } = require('../src/utils/docsRag.js');

describe('docs RAG search', () => {
    test('returns docs excerpts with canonical URLs', async () => {
        const { excerptsText } = await searchDocsRag('custom content import export backup');
        expect(excerptsText).toContain('/docs/');
        expect(excerptsText).toMatch(/\/docs\/[\w-]+#[\w-]+/);
        expect(excerptsText).toMatch(/\n  \S/);
    });

    test('can retrieve routes documentation', async () => {
        const { excerptsText } = await searchDocsRag('routes');
        expect(excerptsText).toContain('/docs/routes#top');
    });

    test('includes changelog chunks for token.place queries', async () => {
        const { results, excerptsText } = await searchDocsRag('token.place');
        const hasChangelog = results.some((result) => result.chunk?.kind === 'changelog');
        expect(hasChangelog).toBe(true);
        expect(excerptsText).toContain('/changelog#');
    });
});
