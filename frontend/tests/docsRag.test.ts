import { describe, expect, it } from 'vitest';
import docsMeta from '../src/generated/rag/docs_meta.json';
import { rankDocsResults, searchDocsRag } from '../src/utils/docsRag.js';

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
            sources.some((entry) => entry.type === 'route' && entry.url === '/docs/routes#top')
        ).toBe(true);
    });

    it('forces routes inclusion for site map requests', async () => {
        const { sources } = await searchDocsRag('Can you generate a site map of DSPACE?', {
            maxResults: 4,
            maxChars: 2000,
        });

        expect(
            sources.some((entry) => entry.type === 'route' && entry.url === '/docs/routes#top')
        ).toBe(true);
    });

    it('returns click-path guidance for custom content backup navigation', async () => {
        const { excerptsText, sources } = await searchDocsRag(
            'How do I get to Custom Content Backup?',
            {
                maxResults: 4,
                maxChars: 2000,
            }
        );

        expect(excerptsText).toMatch(/Custom Content Backup/i);
        expect(excerptsText).toMatch(/\/contentbackup/);
        expect(
            sources.some((entry) => entry.type === 'route' && entry.url === '/docs/routes#top')
        ).toBe(true);
    });

    it('returns routes for custom content export questions', async () => {
        const { excerptsText, sources } = await searchDocsRag(
            'Where do I export custom content? What is the route?',
            {
                maxResults: 6,
                maxChars: 3000,
            }
        );

        expect(excerptsText).toContain('/contentbackup');
        expect(
            sources.some((entry) => entry.type === 'route' && entry.url === '/docs/routes#top')
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
                sources.some((entry) => entry.type === 'route' && entry.url === '/docs/routes#top')
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

    it('prefers v3 release-state docs over legacy changelog results', () => {
        const chunkMap = new Map([
            [
                'doc:v3',
                {
                    id: 'doc:v3',
                    kind: 'doc',
                    slug: '/docs/v3-release-state',
                    anchor: 'top',
                    title: 'Release state',
                    heading: 'Release state',
                    path: 'frontend/src/pages/docs/md/v3-release-state.md',
                },
            ],
            [
                'changelog:legacy',
                {
                    id: 'changelog:legacy',
                    kind: 'changelog',
                    slug: '/changelog',
                    anchor: '20230630',
                    title: 'Changelog',
                    heading: '2023',
                    path: 'frontend/src/pages/docs/md/changelog/20230630.md',
                },
            ],
        ]);
        const results = [
            { id: 'doc:v3', score: 5 },
            { id: 'changelog:legacy', score: 5 },
        ];
        const meta = { legacy: { changelogYears: [2023] }, generatedAt: '2026-02-02T00:00:00Z' };

        const ranked = rankDocsResults(results, chunkMap, meta, 'release state v3');

        expect(ranked[0]?.id).toBe('doc:v3');
    });

    it('deprioritizes legacy changelog chunks for v3 questions', async () => {
        const { sourcesMeta } = await searchDocsRag('Is token.place active in v3?', {
            maxResults: 6,
            maxChars: 4000,
        });
        const legacyAnchors = sourcesMeta.results
            .filter((entry) => entry.kind === 'changelog' && /^2023/.test(entry.anchor || ''))
            .map((entry) => entry.anchor);

        expect(legacyAnchors).toHaveLength(0);
        expect(
            sourcesMeta.results.some(
                (entry) =>
                    (entry.kind === 'doc' && entry.slug === '/docs/v3-release-state') ||
                    (entry.kind === 'changelog' && entry.anchor === '20260301')
            )
        ).toBe(true);
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
        expect(docsMeta.envName).toBeTruthy();
        expect(docsMeta.docsGitSha || docsMeta.gitSha).toBeTruthy();
        expect(excerptsText).toContain(docsMeta.generatedAt);
    });
});
