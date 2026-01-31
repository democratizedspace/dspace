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

    it('forces the routes index for navigation queries', async () => {
        const { sources } = await searchDocsRag('Where is the menu?', {
            maxResults: 4,
            maxChars: 2000,
        });

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

    it('forces changelog sources for release questions', async () => {
        const { sourcesMeta } = await searchDocsRag('Is token.place active in v3?', {
            maxResults: 6,
            maxChars: 3000,
        });

        expect(sourcesMeta.results.some((entry) => entry.kind === 'changelog')).toBe(true);
    });

    it('forces process semantics docs for requires/consumes questions', async () => {
        const { sourcesMeta } = await searchDocsRag(
            'Explain requires vs consumes vs creates and duration semantics',
            { maxResults: 6, maxChars: 3000 }
        );

        const semanticsRegex = /\b(requires|consumes|creates|duration)\b/i;
        const hasSemanticsDoc = sourcesMeta.results.some(
            (entry) =>
                entry.kind === 'doc' &&
                (semanticsRegex.test(entry.title || '') || semanticsRegex.test(entry.heading || ''))
        );
        expect(hasSemanticsDoc).toBe(true);
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
