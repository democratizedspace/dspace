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

    it('caps excerpts output and stays deterministic', async () => {
        const options = {
            maxResults: 12,
            maxChars: 900,
            maxExcerptChars: 160,
        };

        const first = await searchDocsRag('docs', options);
        const second = await searchDocsRag('docs', options);

        expect(first.excerptsText.length).toBeLessThanOrEqual(options.maxChars);
        expect(first.excerptsText.startsWith('---')).toBe(true);
        expect(first.excerptsText.endsWith('---')).toBe(true);
        expect(first.excerptsText).toEqual(second.excerptsText);
    });

    it('includes docs meta generatedAt in output', async () => {
        expect(docsMeta.generatedAt).toBeTruthy();

        const { excerptsText, sourcesMeta } = await searchDocsRag('routes', {
            maxResults: 2,
            maxChars: 1000,
        });

        expect(excerptsText).toContain(`generatedAt: ${docsMeta.generatedAt}`);
        expect(sourcesMeta.generatedAt).toBe(docsMeta.generatedAt);
    });
});
