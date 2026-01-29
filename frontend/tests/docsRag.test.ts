import { describe, expect, it } from 'vitest';
import { searchDocsRag, searchDocsRagWithSources } from '../src/utils/docsRag.js';

describe('docs RAG search', () => {
    it('returns docs excerpts with canonical /docs URLs', async () => {
        const { excerptsText } = await searchDocsRag('custom content import export backup', {
            maxResults: 6,
            maxChars: 4000,
        });

        expect(excerptsText).toMatch(/\/docs\//);
        expect(excerptsText).toMatch(/\/docs\/[^\s#]+#[^\s]+/);
    });

    it('retrieves routes index chunk', async () => {
        const { excerptsText, sources } = await searchDocsRagWithSources('routes', {
            maxResults: 4,
            maxChars: 2000,
        });

        expect(excerptsText).toContain('/docs/routes#top');
        expect(
            sources.some(
                (source) => source.type === 'route' && source.url === '/docs/routes#top'
            )
        ).toBe(true);
    });

    it('retrieves v3 changelog references', async () => {
        const { excerptsText, sourcesMeta, sources } = await searchDocsRagWithSources(
            'token.place',
            {
                maxResults: 6,
                maxChars: 3000,
            }
        );

        expect(excerptsText).toMatch(/\/changelog#[^\s]+/);
        expect(sourcesMeta.results.some((entry) => entry.kind === 'changelog')).toBe(true);
        expect(sources.some((source) => source.type === 'changelog')).toBe(true);
    });
});
