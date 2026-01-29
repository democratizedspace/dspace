import MiniSearch from 'minisearch';

const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_MAX_CHARS = 5000;
const DEFAULT_MAX_EXCERPT_CHARS = 850;

const DEFAULT_SEARCH_OPTIONS = {
    boost: { title: 3, heading: 2 },
    prefix: true,
    fuzzy: 0.2,
};

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
    if (maxChars <= 0) {
        return '';
    }

    if (text.length <= maxChars) {
        return text;
    }

    const clipped = text.slice(0, Math.max(0, maxChars - 1)).trimEnd();
    return clipped ? `${clipped}…` : '';
};

const normalizeExcerpt = (text) =>
    String(text || '')
        .replace(/\s*\n+\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const buildEntry = ({ kind, title, slug, anchor, excerpt }) => {
    const resolvedAnchor = anchor || 'top';
    return `- [${kind}] ${title} — ${slug}#${resolvedAnchor}\n  ${normalizeExcerpt(excerpt)}`;
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
    const results = miniSearch.search(query, DEFAULT_SEARCH_OPTIONS);
    const sortedResults = results.slice().sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) {
            return scoreDiff;
        }
        const aId = String(a.id ?? '');
        const bId = String(b.id ?? '');
        return aId.localeCompare(bId);
    });
    const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
    const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
    const maxExcerptChars = options.maxExcerptChars ?? DEFAULT_MAX_EXCERPT_CHARS;

    const selected = [];
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
    const trailer = '---';
    let output = `${headerLines.join('\n')}\n`;
    const included = [];

    if (output.length + trailer.length > maxChars) {
        return { excerptsText: '', sources: [], sourcesMeta: { results: [] } };
    }

    for (const chunk of selected) {
        const excerpt = trimExcerpt(
            normalizeExcerpt(String(chunk.text || '').trim()),
            maxExcerptChars
        );
        if (!excerpt) continue;

        const resolvedAnchor = chunk.anchor || 'top';
        const entryPrefix =
            `- [${chunk.kind}] ${chunk.title} — ${chunk.slug}#${resolvedAnchor}\n` + '  ';
        const entry = `${buildEntry({
            kind: chunk.kind,
            title: chunk.title,
            slug: chunk.slug,
            anchor: resolvedAnchor,
            excerpt,
        })}\n`;

        if (output.length + entry.length + trailer.length > maxChars) {
            const remaining = maxChars - output.length - trailer.length;
            if (remaining <= 0) {
                break;
            }

            const availableForExcerpt = remaining - entryPrefix.length;
            if (availableForExcerpt <= 0) {
                break;
            }

            const trimmedExcerpt = trimExcerpt(excerpt, availableForExcerpt);
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

            if (output.length + trimmedEntry.length + trailer.length > maxChars) {
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

    output += trailer;

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
