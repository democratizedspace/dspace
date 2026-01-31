import MiniSearch from 'minisearch';

const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_MAX_CHARS = 5000;
const DEFAULT_MAX_EXCERPT_CHARS = 850;
const ROUTES_INTENT =
    /\b(route|routes|url|urls|path|page|menu|navigate|navigation|where is|link)\b/i;
const CHANGELOG_INTENT = /\b(token\.place|tokenplace|v3|v2|release|changelog|deferred|active)\b/i;
const SEMANTICS_INTENT =
    /\b(requires|consumes|creates|duration|timer|recipe|semantics|normalize)\b/i;
const SEMANTICS_KEYWORDS = ['requires', 'consumes', 'creates', 'duration', 'process'];
const SEMANTICS_QUERY = 'requires consumes creates duration semantics';
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

const compareResults = (left, right) => {
    const leftScore = Number.isFinite(left.score) ? left.score : 0;
    const rightScore = Number.isFinite(right.score) ? right.score : 0;
    if (leftScore !== rightScore) {
        return rightScore - leftScore;
    }
    const leftId = String(left.id);
    const rightId = String(right.id);
    return compareIds(leftId, rightId);
};

const hasSemanticsHeading = (chunk) => {
    const title = String(chunk.title || '').toLowerCase();
    const heading = String(chunk.heading || '').toLowerCase();
    return SEMANTICS_KEYWORDS.some(
        (keyword) => title.includes(keyword) || heading.includes(keyword)
    );
};

const findChunkByPredicate = (results, chunkMap, predicate) => {
    for (const result of results) {
        const chunk = chunkMap.get(result.id);
        if (!chunk || !predicate(chunk)) {
            continue;
        }
        return { ...chunk, score: result.score };
    }
    return null;
};

const findChunkById = (chunkMap, scoreMap, id) => {
    const chunk = chunkMap.get(id);
    if (!chunk) {
        return null;
    }
    const score = scoreMap?.get(String(id));
    return { ...chunk, score: Number.isFinite(score) ? score : 0 };
};

const findChunkByFallback = (chunkMap, predicate) => {
    const candidates = Array.from(chunkMap.values())
        .filter(predicate)
        .sort((left, right) => compareIds(String(left.id), String(right.id)));
    if (!candidates.length) {
        return null;
    }
    return { ...candidates[0], score: 0 };
};

const enforceForcedInclude = (selected, maxResults, candidate) => {
    if (!candidate) {
        return;
    }
    if (selected.some((chunk) => String(chunk.id) === String(candidate.id))) {
        return;
    }
    if (selected.length >= maxResults) {
        selected.sort(compareResults);
        selected.pop();
    }
    selected.push(candidate);
    selected.sort(compareResults);
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
    const results = miniSearch.search(query, SEARCH_OPTIONS).sort(compareResults);
    const scoreMap = new Map(results.map((result) => [String(result.id), result.score]));
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

    if (wantsRoutes && !selected.some((chunk) => chunk.kind === 'route')) {
        let routesCandidate = null;
        for (const chunk of chunkMap.values()) {
            if (chunk.kind === 'route' && chunk.slug === '/docs/routes' && chunk.anchor === 'top') {
                routesCandidate = findChunkById(chunkMap, scoreMap, chunk.id);
                break;
            }
        }
        if (!routesCandidate) {
            routesCandidate = findChunkByPredicate(
                results,
                chunkMap,
                (chunk) => chunk.kind === 'route'
            );
        }
        if (!routesCandidate) {
            routesCandidate = findChunkByFallback(chunkMap, (chunk) => chunk.kind === 'route');
        }
        enforceForcedInclude(selected, maxResults, routesCandidate);
    }

    if (wantsChangelog && !selected.some((chunk) => chunk.kind === 'changelog')) {
        let changelogCandidate = findChunkByPredicate(
            results,
            chunkMap,
            (chunk) => chunk.kind === 'changelog'
        );
        if (!changelogCandidate) {
            changelogCandidate = findChunkByFallback(
                chunkMap,
                (chunk) => chunk.kind === 'changelog'
            );
        }
        enforceForcedInclude(selected, maxResults, changelogCandidate);
    }

    const hasSemanticsSelected = selected.some(
        (chunk) => chunk.kind === 'doc' && hasSemanticsHeading(chunk)
    );
    if (wantsSemantics && !hasSemanticsSelected) {
        let semanticsCandidate = findChunkByPredicate(
            results,
            chunkMap,
            (chunk) => chunk.kind === 'doc' && hasSemanticsHeading(chunk)
        );
        if (!semanticsCandidate) {
            const semanticResults = miniSearch
                .search(SEMANTICS_QUERY, SEARCH_OPTIONS)
                .sort(compareResults);
            semanticsCandidate = findChunkByPredicate(
                semanticResults,
                chunkMap,
                (chunk) => chunk.kind === 'doc'
            );
        }
        if (!semanticsCandidate) {
            semanticsCandidate = findChunkByFallback(
                chunkMap,
                (chunk) => chunk.kind === 'doc' && hasSemanticsHeading(chunk)
            );
        }
        enforceForcedInclude(selected, maxResults, semanticsCandidate);
    }

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
