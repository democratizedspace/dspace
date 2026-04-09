import { stripMarkdownToText } from '../../../lib/docs/fullTextSearch';

type DocModule = {
    frontmatter?: { slug?: string };
    rawContent?: () => Promise<string>;
    compiledContent?: () => Promise<string>;
};

const docModules = import.meta.glob('../md/**/*.md');

const buildFullTextCorpus = async () => {
    const entries = await Promise.all(
        Object.values(docModules).map(async (loadModule) => {
            const doc = (await loadModule()) as DocModule;
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

                return [slug, stripMarkdownToText(content)] as const;
            } catch (error) {
                console.error(`Failed to build deferred docs corpus for doc slug ${slug}`, error);

                if (import.meta.env?.DEV) {
                    throw error;
                }

                return [slug, ''] as const;
            }
        })
    );

    return Object.fromEntries(entries.filter((entry) => Array.isArray(entry)));
};

export const GET = async () => {
    const bySlug = await buildFullTextCorpus();

    return new Response(JSON.stringify({ bySlug }), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
};
