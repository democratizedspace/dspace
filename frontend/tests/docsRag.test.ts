import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let searchDocsRag;

describe('docs RAG search', () => {
    beforeAll(async () => {
        vi.stubGlobal('window', {});
        vi.stubGlobal('document', {});
        ({ searchDocsRag } = await import('../src/utils/docsRag.js'));
    });

    afterAll(() => {
        vi.unstubAllGlobals();
    });

    it('returns docs excerpts with canonical URLs', async () => {
        const result = await searchDocsRag('custom content import export backup');

        expect(result.excerptsText).toContain('/docs/');
        expect(result.excerptsText).toMatch(/#[^\s]+/);
        expect(result.excerptsText.length).toBeGreaterThan(0);
    });

    it('finds the routes index chunk', async () => {
        const result = await searchDocsRag('routes');

        expect(result.excerptsText).toContain('/docs/routes#top');
    });

    it('retrieves changelog references for token.place', async () => {
        const result = await searchDocsRag('token.place');
        const hasChangelog = result.sourcesMeta.some((entry) => entry.kind === 'changelog');

        expect(hasChangelog).toBe(true);
    });
});
