import type { APIRoute } from 'astro';

import { stripMarkdownToText } from '../../../lib/docs/fullTextSearch';

const docModules = import.meta.glob('../md/**/*.md');

const getDocContent = async (modulePath: string) => {
    const loader = docModules[modulePath];

    if (!loader) {
        return null;
    }

    const doc = await loader();
    const slug = String(doc?.frontmatter?.slug ?? '').toLowerCase();

    if (!slug) {
        return null;
    }

    let content;

    if (typeof doc.rawContent === 'function') {
        content = await doc.rawContent();
    } else if (typeof doc.compiledContent === 'function') {
        content = await doc.compiledContent();
    } else {
        throw new Error(`No content loader found for doc slug ${slug}`);
    }

    return [slug, stripMarkdownToText(content)] as const;
};

export const prerender = true;

export const GET: APIRoute = async () => {
    const entries = await Promise.all(
        Object.keys(docModules).map(async (modulePath) => {
            try {
                return await getDocContent(modulePath);
            } catch (error) {
                console.error(`Failed to build docs full-text corpus for ${modulePath}`, error);
                return null;
            }
        })
    );

    const corpus = Object.fromEntries(
        entries.filter((entry): entry is readonly [string, string] => !!entry)
    );

    return new Response(JSON.stringify({ corpus }), {
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
    });
};
