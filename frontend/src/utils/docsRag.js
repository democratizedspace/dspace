import MiniSearch from 'minisearch';

const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_MAX_CHARS = 5000;
const DEFAULT_MAX_EXCERPT_CHARS = 850;

const indexOptions = {
    idField: 'id',
    fields: ['title', 'heading', 'text', 'slug', 'path'],
    storeFields: ['id', 'slug', 'title', 'heading', 'anchor', 'kind', 'path'],
    searchOptions: {
        boost: { title: 3, heading: 2 },
    },
};

let docsRagPromise;

const docsKindToType = {
    doc: 'doc',
    route: 'route',
    changelog: 'changelog',
};

const loadDocsRag = async () => {
    if (!docsRagPromise) {
        docsRagPromise = (async () => {
            const [chunksModule, indexModule, metaModule] = await Promise.all([
                import('../generated/rag/docs_chunks.json'),
                import('../generated/rag/docs_index.json'),
                import('../generated/rag/docs_meta.json'),
            ]);

            const chunks = chunksModule.default ?? chunksModule;
            const indexData = indexModule.default ?? indexModule;
            const meta = metaModule.default ?? metaModule;

            let miniSearch = null;

            if (indexData) {
                try {
                    miniSearch = MiniSearch.loadJSON(JSON.stringify(indexData), indexOptions);
                } catch (error) {
                    miniSearch = null;
                }
            }

            if (!miniSearch) {
                miniSearch = new MiniSearch(indexOptions);
                miniSearch.addAll(chunks);
            }

            const chunkMap = new Map(chunks.map((chunk) => [chunk.id, chunk]));

            return { miniSearch, chunkMap, meta };
        })();
    }

    return docsRagPromise;
};

const trimExcerpt = (text, maxChars) => {
    if (text.length <= maxChars) {
        return text;
    }

    const clipped = text.slice(0, Math.max(0, maxChars - 1)).trimEnd();
    return clipped ? `${clipped}…` : '';
};

const buildEntry = ({ kind, title, slug, anchor, excerpt }) => {
    const resolvedAnchor = anchor || 'top';
    return `- [${kind}] ${title} — ${slug}#${resolvedAnchor}\n  ${excerpt}`;
};

const formatSourceLabel = ({ title, heading }) => {
    const trimmedTitle = String(title || '').trim();
    const trimmedHeading = String(heading || '').trim();

    if (trimmedTitle && trimmedHeading && trimmedHeading !== trimmedTitle) {
        return `${trimmedTitle} — ${trimmedHeading}`;
    }

    return trimmedTitle || trimmedHeading || 'Untitled';
};

export const mapDocsResultsToSources = (results = []) => {
    if (!Array.isArray(results) || results.length === 0) {
        return [];
    }

    return results
        .map((result) => {
            const resolvedAnchor = result.anchor || 'top';
            const slug = result.slug ? String(result.slug) : '';
            const type = docsKindToType[result.kind] || 'doc';
            const stableId = slug ? `${type}:${slug}#${resolvedAnchor}` : '';
            const idValue = stableId || result.id;
            const id = idValue != null ? String(idValue) : '';
            const label = formatSourceLabel(result);

            if (!id || !label) {
                return null;
            }

            return {
                type,
                id,
                label,
                url: slug ? `${slug}#${resolvedAnchor}` : undefined,
            };
        })
        .filter(Boolean);
};

export const searchDocsRag = async (queryText, options = {}) => {
    const query = String(queryText || '').trim();

    if (!query) {
        return { excerptsText: '', sources: [], sourcesMeta: { results: [] } };
    }

    let miniSearch;
    let chunkMap;
    let meta;

    try {
        ({ miniSearch, chunkMap, meta } = await loadDocsRag());
    } catch (error) {
        console.error('Failed to load docs RAG data:', error);
        return { excerptsText: '', sources: [], sourcesMeta: { results: [] } };
    }
    const results = miniSearch.search(query, { prefix: true, fuzzy: 0.2 });
    const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
    const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
    const maxExcerptChars = options.maxExcerptChars ?? DEFAULT_MAX_EXCERPT_CHARS;

    const selected = [];
    for (const result of results) {
        const chunk = chunkMap.get(result.id);
        if (!chunk) continue;
        selected.push({ ...chunk, score: result.score });
        if (selected.length >= maxResults) {
            break;
        }
    }

    if (!selected.length) {
        return { excerptsText: '', sources: [], sourcesMeta: { results: [] } };
    }

    const gitSha = meta?.gitSha || 'unknown';
    const headerLines = ['---', `Docs grounding (gitSha: ${gitSha}):`];
    let output = `${headerLines.join('\n')}\n`;
    const included = [];

    for (const chunk of selected) {
        const excerpt = trimExcerpt(String(chunk.text || '').trim(), maxExcerptChars);
        if (!excerpt) continue;

        const resolvedAnchor = chunk.anchor || 'top';
        const entry = `${buildEntry({
            kind: chunk.kind,
            title: chunk.title,
            slug: chunk.slug,
            anchor: resolvedAnchor,
            excerpt,
        })}\n`;

        if (output.length + entry.length + 4 > maxChars) {
            const remaining = maxChars - output.length - 4;
            if (remaining <= 0) {
                break;
            }

            const trimmedExcerpt = trimExcerpt(excerpt, Math.max(0, remaining - 40));
            if (!trimmedExcerpt) {
                break;
            }

            const trimmedEntry = `${buildEntry({
                kind: chunk.kind,
                title: chunk.title,
                slug: chunk.slug,
                anchor: resolvedAnchor,
                excerpt: trimmedExcerpt,
            })}\n`;

            if (output.length + trimmedEntry.length + 4 > maxChars) {
                break;
            }

            output += trimmedEntry;
            included.push({ ...chunk, anchor: resolvedAnchor });
            break;
        }

        output += entry;
        included.push({ ...chunk, anchor: resolvedAnchor });
    }

    if (!included.length) {
        return { excerptsText: '', sources: [], sourcesMeta: { results: [] } };
    }

    output += '---';

    const sourcesMeta = {
        gitSha,
        results: included.map((chunk) => ({
            id: chunk.id,
            slug: chunk.slug,
            anchor: chunk.anchor,
            kind: chunk.kind,
            title: chunk.title,
            heading: chunk.heading,
        })),
    };

    return {
        excerptsText: output,
        sources: mapDocsResultsToSources(sourcesMeta.results),
        sourcesMeta,
    };
};
