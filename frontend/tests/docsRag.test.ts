import { describe, expect, it } from 'vitest';
import docsMeta from '../src/generated/rag/docs_meta.json';
import { searchDocsRag } from '../src/utils/docsRag.js';

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
        const { excerptsText, sources } = await searchDocsRag('routes', {
            maxResults: 4,
            maxChars: 2000,
        });

        expect(excerptsText).toContain('/docs/routes#top');
        expect(
            sources.some((entry) => entry.type === 'route' && entry.url === '/docs/routes#top')
        ).toBe(true);
    });

    it('retrieves v3 changelog references', async () => {
        const { excerptsText, sourcesMeta, sources } = await searchDocsRag('token.place', {
            maxResults: 6,
            maxChars: 3000,
        });

        expect(excerptsText).toMatch(/\/changelog#[^\s]+/);
        expect(sourcesMeta.results.some((entry) => entry.kind === 'changelog')).toBe(true);
        expect(sources.some((entry) => entry.type === 'changelog')).toBe(true);
    });

    it('caps excerpts and stays deterministic', async () => {
        const options = {
            maxResults: 12,
            maxChars: 600,
            maxExcerptChars: 120,
        };

        const first = await searchDocsRag('docs routes changelog', options);
        const second = await searchDocsRag('docs routes changelog', options);

        expect(first.excerptsText.length).toBeLessThanOrEqual(options.maxChars);
        expect(first.excerptsText.startsWith('---')).toBe(true);
        expect(first.excerptsText.endsWith('---')).toBe(true);
        expect(first.excerptsText).toBe(second.excerptsText);
        expect(first.sourcesMeta.results).toEqual(second.sourcesMeta.results);
    });

    it('includes generatedAt metadata', async () => {
        expect(docsMeta.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

        const { excerptsText, sourcesMeta } = await searchDocsRag('docs', {
            maxResults: 2,
            maxChars: 1200,
        });

        expect(excerptsText).toContain(`generatedAt: ${docsMeta.generatedAt}`);
        expect(sourcesMeta.generatedAt).toBe(docsMeta.generatedAt);
    });
});
