import type { APIRoute } from 'astro';

import { stripMarkdownToText } from '../../lib/docs/fullTextSearch';

const docModules = import.meta.glob('./md/**/*.md');

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

export const GET: APIRoute = async () => {
    const bodyBySlug = await readDocBodyBySlug();

    return new Response(JSON.stringify({ bodyBySlug }), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
};
