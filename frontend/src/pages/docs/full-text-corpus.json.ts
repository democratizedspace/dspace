import type { APIRoute } from 'astro';

import { stripMarkdownToText } from '../../lib/docs/fullTextSearch';

const docModules = import.meta.glob('./md/**/*.md', {
    eager: true,
});

const normalizeHref = (value: string) => {
    if (!value) {
        return '';
    }

    const clean = value.split('#')[0].split('?')[0];

    if (!clean.startsWith('/docs/')) {
        return '';
    }

    return clean.replace(/\/?$/, '').toLowerCase();
};

const buildCorpus = async () => {
    const entries = await Promise.all(
        Object.values(docModules).map(async (doc) => {
            const slug = String(
                (doc as { frontmatter?: { slug?: string } })?.frontmatter?.slug ?? ''
            )
                .toLowerCase()
                .trim();

            if (!slug) {
                return null;
            }

            const href = normalizeHref(`/docs/${slug}`);

            if (!href) {
                return null;
            }

            try {
                let content = '';
                const markdownDoc = doc as {
                    rawContent?: () => Promise<string>;
                    compiledContent?: () => Promise<string>;
                };

                if (typeof markdownDoc.rawContent === 'function') {
                    content = await markdownDoc.rawContent();
                } else if (typeof markdownDoc.compiledContent === 'function') {
                    content = await markdownDoc.compiledContent();
                }

                return [href, stripMarkdownToText(content)];
            } catch (error) {
                console.error(`Failed to build docs full-text corpus for ${href}`, error);
                return [href, ''];
            }
        })
    );

    return Object.fromEntries(
        entries.filter((entry): entry is [string, string] => Array.isArray(entry))
    );
};

let cachedCorpusPromise: Promise<Record<string, string>> | null = null;

const getCorpus = () => {
    if (!cachedCorpusPromise) {
        cachedCorpusPromise = buildCorpus();
    }

    return cachedCorpusPromise;
};

export const GET: APIRoute = async () => {
    const corpus = await getCorpus();

    return new Response(JSON.stringify(corpus), {
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'public, max-age=31536000, immutable',
        },
    });
};
