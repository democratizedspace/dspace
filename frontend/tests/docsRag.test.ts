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

    it('retrieves process semantics docs', async () => {
        const { excerptsText, sourcesMeta, sources } = await searchDocsRag(
            'requires consumes creates duration semantics',
            {
                maxResults: 6,
                maxChars: 3000,
            }
        );
        const semanticsPattern = /\b(requires|consumes|creates|duration|process)\b/i;
        const hasSemanticsSource = sourcesMeta.results.some(
            (entry) =>
                entry.kind === 'doc' &&
                String(entry.slug || '').startsWith('/docs/') &&
                semanticsPattern.test(`${entry.title ?? ''} ${entry.heading ?? ''}`)
        );

        expect(excerptsText).toMatch(semanticsPattern);
        expect(hasSemanticsSource).toBe(true);
        expect(sources.some((entry) => entry.type === 'doc')).toBe(true);
    });

    it('caps excerpts and remains deterministic', async () => {
        const options = { maxResults: 15, maxChars: 700, maxExcerptChars: 140 };
        const first = await searchDocsRag('docs', options);
        const second = await searchDocsRag('docs', options);

        expect(first.excerptsText.length).toBeLessThanOrEqual(options.maxChars);
        expect(first.excerptsText.startsWith('---')).toBe(true);
        expect(first.excerptsText.endsWith('---')).toBe(true);
        expect(first.excerptsText).toBe(second.excerptsText);
    });

    it('exposes generatedAt metadata in docs results', async () => {
        const { excerptsText } = await searchDocsRag('routes', {
            maxResults: 4,
            maxChars: 2000,
        });

        expect(docsMeta.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(excerptsText).toContain(docsMeta.generatedAt);
    });
});
