import MiniSearch from 'minisearch';

const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_MAX_CHARS = 5000;
const DEFAULT_MAX_EXCERPT_CHARS = 850;
const DEFAULT_SEARCH_OPTIONS = {
    prefix: true,
    fuzzy: 0.2,
    boost: { title: 3, heading: 2 },
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

const normalizeExcerpt = (text) =>
    String(text || '')
        .replace(/\s+/g, ' ')
        .trim();

const trimExcerpt = (text, maxChars) => {
    if (text.length <= maxChars) {
        return text;
    }

    const clipped = text.slice(0, Math.max(0, maxChars - 1)).trimEnd();
    return clipped ? `${clipped}…` : '';
};

const buildHeaderText = ({ gitSha, generatedAt }) => {
    const generatedAtValue = generatedAt || 'unknown';
    return `---\nDocs grounding (gitSha: ${gitSha}, generatedAt: ${generatedAtValue}):\n`;
};

const sortResultsDeterministically = (results) =>
    [...results].sort((left, right) => {
        if (left.score !== right.score) {
            return right.score - left.score;
        }
        const leftId = String(left.id ?? '');
        const rightId = String(right.id ?? '');
        if (leftId < rightId) {
            return -1;
        }
        if (leftId > rightId) {
            return 1;
        }
        return 0;
    });

const buildEntryWithExcerpt = ({ kind, title, slug, anchor, excerpt }) => {
    const baseEntry = `- [${kind}] ${title} — ${slug}#${anchor}\n  `;
    return `${baseEntry}${excerpt}\n`;
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
    const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
    const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
    const maxExcerptChars = options.maxExcerptChars ?? DEFAULT_MAX_EXCERPT_CHARS;

    const selected = [];
    const orderedResults = sortResultsDeterministically(results);
    for (const result of orderedResults) {
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
    let headerText = buildHeaderText({ gitSha, generatedAt });
    const footerText = '---';
    const maxHeaderLength = Math.max(0, maxChars - footerText.length);
    if (headerText.length > maxHeaderLength) {
        headerText = headerText.slice(0, maxHeaderLength);
        if (headerText.length && !headerText.endsWith('\n')) {
            headerText = `${headerText.replace(/\s+$/, '')}\n`.slice(0, maxHeaderLength);
        }
    }
    let output = headerText;
    const included = [];
    let remaining = maxChars - headerText.length - footerText.length;
    if (remaining <= 0) {
        return {
            excerptsText: `${headerText}${footerText}`,
            sources: [],
            sourcesMeta: { results: [] },
        };
    }

    for (const chunk of selected) {
        const excerpt = trimExcerpt(normalizeExcerpt(chunk.text), maxExcerptChars);
        if (!excerpt) continue;

        const resolvedAnchor = chunk.anchor || 'top';
        const entry = buildEntryWithExcerpt({
            kind: chunk.kind,
            title: chunk.title,
            slug: chunk.slug,
            anchor: resolvedAnchor,
            excerpt,
        });
        if (entry.length > remaining) {
            const baseEntry = buildEntryWithExcerpt({
                kind: chunk.kind,
                title: chunk.title,
                slug: chunk.slug,
                anchor: resolvedAnchor,
                excerpt: '',
            });
            const maxEntryExcerpt = remaining - baseEntry.length;
            if (maxEntryExcerpt <= 0) {
                break;
            }
            const trimmedExcerpt = trimExcerpt(excerpt, maxEntryExcerpt);
            if (!trimmedExcerpt) {
                break;
            }
            const trimmedEntry = buildEntryWithExcerpt({
                kind: chunk.kind,
                title: chunk.title,
                slug: chunk.slug,
                anchor: resolvedAnchor,
                excerpt: trimmedExcerpt,
            });
            if (trimmedEntry.length > remaining) {
                break;
            }
            output += trimmedEntry;
            remaining -= trimmedEntry.length;
            included.push({ ...chunk, anchor: resolvedAnchor });
            break;
        }

        output += entry;
        remaining -= entry.length;
        included.push({ ...chunk, anchor: resolvedAnchor });
    }

    if (!included.length) {
        return {
            excerptsText: `${headerText}${footerText}`,
            sources: [],
            sourcesMeta: { results: [] },
        };
    }

    output += footerText;

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
