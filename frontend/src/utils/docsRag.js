import MiniSearch from 'minisearch';

const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_MAX_CHARS = 5000;
const DEFAULT_MAX_EXCERPT_CHARS = 850;
const ROUTES_INTENT =
    /\b(route|routes|url|urls|path|page|menu|navigate|navigation|where is|link)\b/i;
const CHANGELOG_INTENT =
    /\b(token\.place|tokenplace|changelog|release|version(?:\s+notes?)?|what'?s new)\b/i;
const SEMANTICS_INTENT =
    /\b(requires|consumes|creates|duration|timer|recipe|semantics|normalize)\b/i;
const CUSTOM_CONTENT_INTENT =
    /\b(custom content|custom quest|custom quests|quest editor|import|export|backup|contentbackup|json schema|manage quests|manage items|manage processes)\b/i;
const SEMANTICS_MATCH = /\b(requires|consumes|creates|duration|process)\b/i;
const SEMANTICS_FALLBACK_QUERY = 'requires consumes creates duration semantics';
const CUSTOM_CONTENT_MATCH =
    /\b(custom content|quest editor|import|export|backup|schema|content backup)\b/i;
const CUSTOM_CONTENT_FALLBACK_QUERY = 'custom content editor import export backup json schema';
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

const resolveAnchor = (anchor) => anchor || 'top';

const buildEntry = ({ kind, title, slug, anchor, excerpt }) => {
    const resolvedAnchor = resolveAnchor(anchor);
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

const compareResultsByRank = (left, right) => {
    if (left.score !== right.score) {
        return right.score - left.score;
    }
    return compareIds(String(left.id), String(right.id));
};

const matchesSemanticsChunk = (chunk) => {
    const title = String(chunk.title || '');
    const heading = String(chunk.heading || '');
    return SEMANTICS_MATCH.test(`${title} ${heading}`);
};

const matchesCustomContentChunk = (chunk) => {
    if (chunk.kind !== 'doc') {
        return false;
    }
    const title = String(chunk.title || '');
    const heading = String(chunk.heading || '');
    return CUSTOM_CONTENT_MATCH.test(`${title} ${heading}`);
};

const matchesCustomContentFallback = (chunk) => {
    if (chunk.kind !== 'doc') {
        return false;
    }
    const title = String(chunk.title || '');
    const heading = String(chunk.heading || '');
    const combined = `${title} ${heading}`;
    return /\bcustom\b/i.test(combined) && /\b(editor|backup|import|export)\b/i.test(combined);
};

const findHighestRankedChunk = (results, chunkMap, predicate) => {
    for (const result of results) {
        const chunk = chunkMap.get(result.id);
        if (!chunk) continue;
        if (predicate(chunk)) {
            return { ...chunk, score: result.score };
        }
    }
    return null;
};

const findDeterministicChunk = (chunkMap, predicate) => {
    const candidates = [];
    for (const chunk of chunkMap.values()) {
        if (predicate(chunk)) {
            candidates.push(chunk);
        }
    }
    if (!candidates.length) {
        return null;
    }
    candidates.sort((left, right) => compareIds(String(left.id), String(right.id)));
    return { ...candidates[0], score: 0 };
};

const dropLowestRanked = (selected) => {
    if (!selected.length) return;
    let lowestIndex = 0;
    for (let index = 1; index < selected.length; index += 1) {
        if (compareResultsByRank(selected[index], selected[lowestIndex]) < 0) {
            lowestIndex = index;
        }
    }
    selected.splice(lowestIndex, 1);
};

const includeForcedChunk = (selected, chunk, maxResults) => {
    if (!chunk) {
        return;
    }
    if (selected.some((entry) => entry.id === chunk.id)) {
        return;
    }
    if (selected.length >= maxResults) {
        dropLowestRanked(selected);
    }
    selected.push(chunk);
};

export const mapDocsResultsToSources = (results = []) => {
    if (!Array.isArray(results) || results.length === 0) {
        return [];
    }

    return results
        .map((result) => {
            const resolvedAnchor = resolveAnchor(result.anchor);
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
    const results = miniSearch.search(query, SEARCH_OPTIONS).sort(compareResultsByRank);
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

    const wantsRoutes = ROUTES_INTENT.test(query);
    const wantsChangelog = CHANGELOG_INTENT.test(query);
    const wantsSemantics = SEMANTICS_INTENT.test(query);
    const wantsCustomContent = CUSTOM_CONTENT_INTENT.test(query);

    if (wantsRoutes) {
        const preferredRoute =
            findHighestRankedChunk(
                results,
                chunkMap,
                (chunk) =>
                    chunk.kind === 'route' &&
                    chunk.slug === '/docs/routes' &&
                    resolveAnchor(chunk.anchor) === 'top'
            ) ||
            findHighestRankedChunk(results, chunkMap, (chunk) => chunk.kind === 'route') ||
            findDeterministicChunk(
                chunkMap,
                (chunk) =>
                    chunk.kind === 'route' &&
                    chunk.slug === '/docs/routes' &&
                    resolveAnchor(chunk.anchor) === 'top'
            ) ||
            findDeterministicChunk(chunkMap, (chunk) => chunk.kind === 'route');
        includeForcedChunk(selected, preferredRoute, maxResults);
    }

    if (wantsChangelog) {
        const preferredChangelog =
            findHighestRankedChunk(results, chunkMap, (chunk) => chunk.kind === 'changelog') ||
            findDeterministicChunk(chunkMap, (chunk) => chunk.kind === 'changelog');
        includeForcedChunk(selected, preferredChangelog, maxResults);
    }

    if (wantsSemantics) {
        let semanticsChunk = findHighestRankedChunk(results, chunkMap, (chunk) => {
            return chunk.kind === 'doc' && matchesSemanticsChunk(chunk);
        });

        if (!semanticsChunk) {
            const semanticResults = miniSearch
                .search(SEMANTICS_FALLBACK_QUERY, SEARCH_OPTIONS)
                .sort(compareResultsByRank);
            semanticsChunk = findHighestRankedChunk(semanticResults, chunkMap, (chunk) => {
                return chunk.kind === 'doc';
            });
        }

        if (!semanticsChunk) {
            semanticsChunk = findDeterministicChunk(chunkMap, (chunk) => {
                return chunk.kind === 'doc' && matchesSemanticsChunk(chunk);
            });
        }

        includeForcedChunk(selected, semanticsChunk, maxResults);
    }

    if (wantsCustomContent) {
        let customContentChunk = findHighestRankedChunk(
            results,
            chunkMap,
            matchesCustomContentChunk
        );

        if (!customContentChunk) {
            const customResults = miniSearch
                .search(CUSTOM_CONTENT_FALLBACK_QUERY, SEARCH_OPTIONS)
                .sort(compareResultsByRank);
            customContentChunk = findHighestRankedChunk(customResults, chunkMap, (chunk) => {
                return chunk.kind === 'doc';
            });
        }

        if (!customContentChunk) {
            customContentChunk = findDeterministicChunk(chunkMap, matchesCustomContentFallback);
        }

        includeForcedChunk(selected, customContentChunk, maxResults);
    }

    selected.sort(compareResultsByRank);

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

        const resolvedAnchor = resolveAnchor(chunk.anchor);
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
