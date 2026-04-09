import type { APIRoute } from 'astro';

import { stripMarkdownToText } from '../../lib/docs/fullTextSearch';

const docModules = import.meta.glob('./md/**/*.md');
let memoizedBodyBySlugPromise: Promise<Record<string, string>> | null = null;

const readDocBodyBySlug = async () => {
    const entries = await Promise.all(
        Object.values(docModules).map(async (loadModule) => {
            const doc = await loadModule();
            const slug = String(doc?.frontmatter?.slug ?? '').toLowerCase();

            if (!slug) {
                return null;
            }

            try {
                let content = '';

                if (typeof doc.rawContent === 'function') {
                    content = await doc.rawContent();
                } else if (typeof doc.compiledContent === 'function') {
                    content = await doc.compiledContent();
                } else {
                    throw new Error(`No supported content loader found for doc slug ${slug}`);
                }

                return [slug, stripMarkdownToText(content)];
            } catch (error) {
                console.error(`Failed to build docs full-text corpus for doc slug ${slug}`, error);

                if (import.meta.env?.DEV) {
                    throw error;
                }

                return [slug, ''];
            }
        })
    );

    return Object.fromEntries(entries.filter((entry) => Array.isArray(entry)));
};

const getBodyBySlug = async () => {
    if (import.meta.env?.DEV) {
        return readDocBodyBySlug();
    }

    if (!memoizedBodyBySlugPromise) {
        memoizedBodyBySlugPromise = readDocBodyBySlug().catch((error) => {
            memoizedBodyBySlugPromise = null;
            throw error;
        });
    }

    return memoizedBodyBySlugPromise;
};

export const GET: APIRoute = async () => {
    const bodyBySlug = await getBodyBySlug();

    return new Response(JSON.stringify({ bodyBySlug }), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
};
