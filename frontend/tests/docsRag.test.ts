import { describe, expect, it } from 'vitest';
import { searchDocsRag } from '../src/utils/docsRag.js';

describe('searchDocsRag', () => {
    it('returns docs excerpts with canonical /docs URLs', async () => {
        const result = await searchDocsRag('custom content import export backup');

        expect(result.excerptsText).toMatch(/Docs grounding/);
        expect(result.excerptsText).toMatch(/\/docs\//);
        expect(result.sourcesMeta.sources.length).toBeGreaterThan(0);
        expect(result.sourcesMeta.sources[0].excerpt).toBeTruthy();
    });

    it('retrieves the routes index chunk for routes queries', async () => {
        const result = await searchDocsRag('routes');

        expect(result.excerptsText).toMatch(/\/docs\/routes#top/);
    });

    it('retrieves changelog context for token.place queries', async () => {
        const result = await searchDocsRag('token.place');

        expect(result.sourcesMeta.sources.some((source) => source.kind === 'changelog')).toBe(true);
    });
});
