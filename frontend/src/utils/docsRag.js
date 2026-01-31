import MiniSearch from 'minisearch';

const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_MAX_CHARS = 5000;
const DEFAULT_MAX_EXCERPT_CHARS = 850;
const ROUTES_INTENT =
    /\b(route|routes|url|urls|path|page|menu|navigate|navigation|where is|link)\b/i;
const CHANGELOG_INTENT = /\b(token\.place|tokenplace|v3|v2|release|changelog|deferred|active)\b/i;
const SEMANTICS_INTENT =
    /\b(requires|consumes|creates|duration|timer|recipe|semantics|normalize)\b/i;
const SEMANTICS_HEADING = /\b(requires|consumes|creates|duration|process)\b/i;
const SEMANTICS_FALLBACK_QUERY = 'requires consumes creates duration semantics';
const SEARCH_OPTIONS = Object.freeze({
    boost: { title: 3, heading: 2 },
    prefix: true,
    fuzzy: 0.2,
});

const indexOptions = {
    idField: 'id',
    fields: ['title', 'heading', 'text', 'slug', 'path'],
    storeFields: ['id', 'slug', 'title', 'heading', 'anchor', 'kind', 'path'],
    searchOptions: SEARCH_OPTIONS,
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

    const trimmedText = text.endsWith('…') ? text.slice(0, -1) : text;
    const clipped = trimmedText.slice(0, Math.max(0, maxChars - 1)).trimEnd();
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

const compareIds = (leftId, rightId) => {
    if (leftId < rightId) return -1;
    if (leftId > rightId) return 1;
    return 0;
};

const sortResults = (results) =>
    results.slice().sort((left, right) => {
        if (left.score !== right.score) {
            return right.score - left.score;
        }
        const leftId = String(left.id);
        const rightId = String(right.id);
        return compareIds(leftId, rightId);
    });

const sortSelected = (entries) =>
    entries.sort((left, right) => {
        if (left.score !== right.score) {
            return right.score - left.score;
        }
        return compareIds(String(left.id), String(right.id));
    });

const findBestResultMatch = (results, chunkMap, predicate) => {
    for (const result of results) {
        const chunk = chunkMap.get(result.id);
        if (chunk && predicate(chunk)) {
            return { chunk, score: result.score };
        }
    }
    return null;
};

const selectDeterministicCandidate = (chunks, predicate) => {
    let selected = null;
    for (const chunk of chunks) {
        if (!predicate(chunk)) continue;
        if (!selected || compareIds(String(chunk.id), String(selected.id)) < 0) {
            selected = chunk;
        }
    }
    return selected;
};

const findChunkBySlugAnchorKind = (chunks, { slug, anchor, kind }) => {
    const anchored = selectDeterministicCandidate(
        chunks,
        (chunk) => chunk.kind === kind && chunk.slug === slug && (chunk.anchor || 'top') === anchor
    );
    if (anchored) {
        return anchored;
    }
    return selectDeterministicCandidate(
        chunks,
        (chunk) => chunk.kind === kind && chunk.slug === slug
    );
};

const addForcedSelection = (selected, entry, maxResults) => {
    if (!entry?.chunk) return;
    if (selected.some((item) => item.id === entry.chunk.id)) return;
    selected.push({
        ...entry.chunk,
        score: entry.score ?? Number.NEGATIVE_INFINITY,
        forced: true,
    });
    if (selected.length <= maxResults) {
        return;
    }
    const candidates = selected.filter((item) => !item.forced);
    const pool = candidates.length ? candidates : selected;
    const sorted = sortSelected(pool.slice());
    const toRemove = sorted[sorted.length - 1];
    const index = selected.findIndex((item) => item.id === toRemove.id);
    if (index >= 0) {
        selected.splice(index, 1);
    }
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
    const results = sortResults(miniSearch.search(query, SEARCH_OPTIONS));
    const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
    const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
    const maxExcerptChars = options.maxExcerptChars ?? DEFAULT_MAX_EXCERPT_CHARS;

    const selected = [];
    for (const result of results) {
        const chunk = chunkMap.get(result.id);
        if (!chunk) continue;
        selected.push({ ...chunk, score: result.score, forced: false });
        if (selected.length >= maxResults) {
            break;
        }
    }

    const chunkList = Array.from(chunkMap.values());
    const intents = {
        routes: ROUTES_INTENT.test(query),
        changelog: CHANGELOG_INTENT.test(query),
        semantics: SEMANTICS_INTENT.test(query),
    };
    const scoreMap = new Map(results.map((result) => [result.id, result.score]));

    if (intents.routes) {
        const preferredRoute = findChunkBySlugAnchorKind(chunkList, {
            slug: '/docs/routes',
            anchor: 'top',
            kind: 'route',
        });
        const routeFromResults =
            findBestResultMatch(results, chunkMap, (chunk) => chunk.kind === 'route') ?? null;
        const routeFallback = preferredRoute ?? routeFromResults?.chunk;
        const routeScore = routeFallback ? scoreMap.get(routeFallback.id) : undefined;
        const routeCandidate =
            preferredRoute && routeFromResults?.chunk?.id === preferredRoute.id
                ? routeFromResults
                : routeFallback
                  ? { chunk: routeFallback, score: routeScore }
                  : routeFromResults;
        addForcedSelection(selected, routeCandidate, maxResults);
    }

    if (intents.changelog) {
        const changelogCandidate =
            findBestResultMatch(results, chunkMap, (chunk) => chunk.kind === 'changelog') ??
            (() => {
                const fallback = selectDeterministicCandidate(
                    chunkList,
                    (chunk) => chunk.kind === 'changelog'
                );
                if (!fallback) return null;
                return { chunk: fallback, score: scoreMap.get(fallback.id) };
            })();
        addForcedSelection(selected, changelogCandidate, maxResults);
    }

    if (intents.semantics) {
        const semanticsCandidate =
            findBestResultMatch(results, chunkMap, (chunk) => {
                if (chunk.kind !== 'doc') return false;
                const label = `${chunk.title || ''} ${chunk.heading || ''}`;
                return SEMANTICS_HEADING.test(label);
            }) ?? null;

        if (semanticsCandidate) {
            addForcedSelection(selected, semanticsCandidate, maxResults);
        } else {
            const fallbackResults = sortResults(
                miniSearch.search(SEMANTICS_FALLBACK_QUERY, SEARCH_OPTIONS)
            );
            const fallbackCandidate = findBestResultMatch(
                fallbackResults,
                chunkMap,
                (chunk) => chunk.kind === 'doc'
            );
            addForcedSelection(selected, fallbackCandidate, maxResults);
        }
    }

    sortSelected(selected);

    if (!selected.length) {
        return { excerptsText: '', sources: [], sourcesMeta: { results: [] } };
    }

    const gitSha = meta?.gitSha || 'unknown';
    const generatedAt = meta?.generatedAt || 'unknown';
    const headerLines = ['---', `Docs grounding (gitSha: ${gitSha}, generatedAt: ${generatedAt}):`];
    const header = `${headerLines.join('\n')}\n`;
    const footer = '---';
    const minBlockLength = header.length + footer.length;
    if (minBlockLength > maxChars) {
        return { excerptsText: '', sources: [], sourcesMeta: { results: [] } };
    }

    let output = header;
    const included = [];

    for (const chunk of selected) {
        const excerpt = trimExcerpt(String(chunk.text || '').trim(), maxExcerptChars);
        if (!excerpt) continue;

        const resolvedAnchor = chunk.anchor || 'top';
        const entryBase = buildEntry({
            kind: chunk.kind,
            title: chunk.title,
            slug: chunk.slug,
            anchor: resolvedAnchor,
            excerpt: '',
        });
        const entryOverhead = entryBase.length + 1;
        const availableForEntry = maxChars - output.length - footer.length;

        if (availableForEntry <= 0) {
            break;
        }

        if (entryOverhead > availableForEntry) {
            break;
        }

        const maxExcerptForEntry = Math.min(maxExcerptChars, availableForEntry - entryOverhead);
        const finalExcerpt = trimExcerpt(excerpt, maxExcerptForEntry);
        if (!finalExcerpt) {
            continue;
        }

        const entry = `${buildEntry({
            kind: chunk.kind,
            title: chunk.title,
            slug: chunk.slug,
            anchor: resolvedAnchor,
            excerpt: finalExcerpt,
        })}\n`;

        if (entry.length > availableForEntry) {
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
