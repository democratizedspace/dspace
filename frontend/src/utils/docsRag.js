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

const SEARCH_OPTIONS = {
    combineWith: 'OR',
    prefix: true,
    fuzzy: 0.2,
    boost: { title: 3, heading: 2 },
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

const normalizeExcerpt = (text) => String(text || '').replace(/\s+/g, ' ').trim();

const trimExcerpt = (text, maxChars) => {
    if (maxChars <= 0) {
        return '';
    }

    if (text.length <= maxChars) {
        return text;
    }

    const clipped = text.slice(0, Math.max(0, maxChars - 1)).trimEnd();
    return clipped ? `${clipped}…` : '';
};

const buildEntryLines = ({ kind, title, slug, anchor }) => {
    const resolvedAnchor = anchor || 'top';
    const prefix = `- [${kind}] ${title} — ${slug}#${resolvedAnchor}\n  `;
    return { prefix };
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
    const results = miniSearch.search(query, SEARCH_OPTIONS);
    const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
    const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
    const maxExcerptChars = options.maxExcerptChars ?? DEFAULT_MAX_EXCERPT_CHARS;

    const selected = [];
    const sortedResults = [...results].sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return String(a.id).localeCompare(String(b.id));
    });

    for (const result of sortedResults) {
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
    const generatedAt = meta?.generatedAt || 'unknown';
    const headerLines = ['---', `Docs grounding (gitSha: ${gitSha}, generatedAt: ${generatedAt}):`];
    const header = `${headerLines.join('\n')}\n`;
    const footer = '---';

    if (header.length + footer.length > maxChars) {
        return { excerptsText: '', sources: [], sourcesMeta: { results: [] } };
    }

    let output = header;
    const included = [];

    for (const chunk of selected) {
        const resolvedAnchor = chunk.anchor || 'top';
        const normalizedExcerpt = normalizeExcerpt(chunk.text);
        const excerpt = trimExcerpt(normalizedExcerpt, maxExcerptChars);
        if (!excerpt) {
            continue;
        }

        const { prefix } = buildEntryLines({
            kind: chunk.kind,
            title: chunk.title,
            slug: chunk.slug,
            anchor: resolvedAnchor,
        });

        const remaining = maxChars - output.length - footer.length;
        if (remaining <= 0) {
            break;
        }

        const entryMaxExcerpt = remaining - prefix.length - 1;
        if (entryMaxExcerpt <= 0) {
            break;
        }

        const trimmedExcerpt =
            entryMaxExcerpt < excerpt.length
                ? trimExcerpt(excerpt, entryMaxExcerpt)
                : excerpt;
        if (!trimmedExcerpt) {
            break;
        }

        const entry = `${prefix}${trimmedExcerpt}\n`;
        if (entry.length > remaining) {
            break;
        }

        output += entry;
        included.push({ ...chunk, anchor: resolvedAnchor });
    }

    if (!included.length) {
        return { excerptsText: '', sources: [], sourcesMeta: { results: [] } };
    }

    output += footer;

    const sourcesMeta = {
        gitSha,
        generatedAt,
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
