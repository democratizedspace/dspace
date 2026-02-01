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

        expect(excerptsText).toContain('/docs/routes#canonical-route-index');
        expect(
            sources.some(
                (entry) =>
                    entry.type === 'route' && entry.url === '/docs/routes#canonical-route-index'
            )
        ).toBe(true);
    });

    it('includes custom content docs for editor/import/export questions', async () => {
        const { excerptsText, sources } = await searchDocsRag(
            'How do I add custom content to DSPACE?',
            {
                maxResults: 6,
                maxChars: 3000,
            }
        );

        const hasDocSource = sources.some(
            (entry) => entry.type === 'doc' && String(entry.url || '').startsWith('/docs/')
        );
        const sourceLabels = sources.map((entry) => entry.label).join(' ');

        expect(hasDocSource).toBe(true);
        expect(`${excerptsText} ${sourceLabels}`).toMatch(/\bcustom content\b/i);
    });

    it('keeps custom content docs under tight maxChars caps', async () => {
        const { excerptsText, sources } = await searchDocsRag(
            'How do I add custom content to DSPACE?',
            {
                maxResults: 6,
                maxChars: 300,
            }
        );

        const hasDocSource = sources.some(
            (entry) => entry.type === 'doc' && String(entry.url || '').startsWith('/docs/')
        );
        const sourceLabels = sources.map((entry) => entry.label).join(' ');

        expect(hasDocSource).toBe(true);
        expect(`${excerptsText} ${sourceLabels}`).toMatch(/\bcustom content\b/i);
    });

    it('forces routes inclusion for navigation queries', async () => {
        const { sources } = await searchDocsRag('Where is the menu?', {
            maxResults: 4,
            maxChars: 2000,
        });

        expect(
            sources.some(
                (entry) =>
                    entry.type === 'route' && entry.url === '/docs/routes#canonical-route-index'
            )
        ).toBe(true);
    });

    it('forces routes inclusion for site map requests', async () => {
        const { sources } = await searchDocsRag('Can you generate a site map of DSPACE?', {
            maxResults: 4,
            maxChars: 2000,
        });

        expect(
            sources.some(
                (entry) =>
                    entry.type === 'route' && entry.url === '/docs/routes#canonical-route-index'
            )
        ).toBe(true);
    });

    it.each(['Generate a sitemap of DSPACE.', 'Generate a site-map of DSPACE.'])(
        'forces routes inclusion for sitemap requests: %s',
        async (query) => {
            const { sources } = await searchDocsRag(query, {
                maxResults: 4,
                maxChars: 2000,
            });

            expect(
                sources.some(
                    (entry) =>
                        entry.type === 'route' &&
                        entry.url === '/docs/routes#canonical-route-index'
                )
            ).toBe(true);
        }
    );

    it('retrieves v3 changelog references', async () => {
        const { excerptsText, sourcesMeta, sources } = await searchDocsRag('token.place', {
            maxResults: 6,
            maxChars: 3000,
        });

        expect(excerptsText).toMatch(/\/changelog#[^\s]+/);
        expect(sourcesMeta.results.some((entry) => entry.kind === 'changelog')).toBe(true);
        expect(sources.some((entry) => entry.type === 'changelog')).toBe(true);
    });

    it('forces changelog inclusion for version status queries', async () => {
        const { sourcesMeta } = await searchDocsRag('Is token.place active in v3?', {
            maxResults: 6,
            maxChars: 3000,
        });

        expect(sourcesMeta.results.some((entry) => entry.kind === 'changelog')).toBe(true);
    });

    it('retrieves process semantics doc chunk', async () => {
        const { excerptsText, sourcesMeta, sources } = await searchDocsRag(
            'requires consumes creates duration semantics',
            {
                maxResults: 6,
                maxChars: 3000,
            }
        );

        expect(excerptsText).toMatch(/\b(requires|consumes|creates|duration)\b/i);
        const semanticsMatch = sourcesMeta.results.find(
            (entry) =>
                entry.kind === 'doc' &&
                /\b(requires|consumes|creates|duration|process)\b/i.test(
                    `${entry.title || ''} ${entry.heading || ''}`
                )
        );
        expect(semanticsMatch).toBeTruthy();
        expect(
            sources.some(
                (entry) => entry.type === 'doc' && String(entry.url || '').startsWith('/docs/')
            )
        ).toBe(true);
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
