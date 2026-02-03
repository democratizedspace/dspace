import MiniSearch from 'minisearch';

const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_MAX_CHARS = 5000;
const DEFAULT_MAX_EXCERPT_CHARS = 850;
const ROUTES_INTENT =
    /\b(route|routes|url|urls|path|page|menu|navigate|navigation|where is|link|sitemap|site[-\s]?map)\b/i;
const CHANGELOG_INTENT =
    /\b(token\.place|tokenplace|changelog|release|version(?:\s+notes?)?|what'?s new)\b/i;
const DRIFT_INTENT =
    /\b(drift|deprecat(?:ed|ion)|removed|not applicable|release state|current behavior|current state)\b/i;
const DRIFT_VERSION_CUE = /\b(v2|v3|v2[-\s]?only|v2\s*(?:to|->|→|vs\.?|\/)\s*v3)\b/i;
const LEGACY_QUERY_INTENT = /\b(legacy|v1|v2|2023|pre[-\s]?v3|historical|old)\b/i;
const SEMANTICS_INTENT =
    /\b(requires|consumes|creates|duration|timer|recipe|semantics|normalize)\b/i;
const SEMANTICS_MATCH = /\b(requires|consumes|creates|duration|process)\b/i;
const SEMANTICS_FALLBACK_QUERY = 'requires consumes creates duration semantics';
const CUSTOM_CONTENT_INTENT =
    /\b(custom content|custom quests?|quest editor|content editor|manage (?:quests|items|processes)|custom (?:items|processes)|content backup|backup (?:custom|content)|custom (?:import|export)|(?:import|export) (?:custom|quest|content)|json schema)\b/i;
const CUSTOM_CONTENT_CONTEXT = /\b(custom|quest|content)\b/i;
const CUSTOM_CONTENT_SIGNAL = /\b(editor|import|export|backup|schema)\b/i;
const CUSTOM_CONTENT_MATCH =
    /\b(custom content|quest editor|content editor|content backup|json schema)\b/i;
const CUSTOM_CONTENT_FALLBACK_QUERY = 'custom content editor import export backup json schema';
const CUSTOM_CONTENT_FALLBACK_REQUIRED = /\bcustom\b/i;
const CUSTOM_CONTENT_FALLBACK_ACTION = /\b(editor|backup|import|export)\b/i;
const CUSTOM_CONTENT_ROUTE_SIGNAL = /\b(export|import|backup)\b/i;
const CUSTOM_CONTENT_BACKUP_MATCH = /\bcustom content backup\b|\/contentbackup/i;
const PRIORITY_DOC_SLUGS = new Set(['/docs/v3-release-state', '/docs/routes', '/docs/backups']);
const PRIORITY_CHANGELOG_ANCHORS = new Set(['20260301']);
const GITHUB_BLOB_PATTERN = /https?:\/\/github\.com\/[^)\s]+\/blob\/[^\s)]+/gi;
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

const normalizeSha = (value) => String(value || '').trim();
const normalizeComparableSha = (value) => {
    const normalized = normalizeSha(value);
    if (!normalized || normalized.toLowerCase() === 'unknown') {
        return '';
    }
    return normalized;
};

const shasMatch = (appSha, docsSha) => {
    const left = normalizeSha(appSha);
    const right = normalizeSha(docsSha);
    if (!left || !right) {
        return false;
    }
    if (left === right) {
        return true;
    }
    if (left.length < right.length) {
        return right.startsWith(left);
    }
    if (right.length < left.length) {
        return left.startsWith(right);
    }
    return false;
};

export const getDocsRagMeta = async () => {
    try {
        const { meta } = await loadDocsRag();
        return meta ?? {};
    } catch (error) {
        console.error('Failed to load docs RAG metadata:', error);
        return {};
    }
};

export const getDocsRagComparison = (appGitSha, docsGitSha) => {
    const appSha = normalizeComparableSha(appGitSha);
    const docsSha = normalizeComparableSha(docsGitSha);

    if (!appSha) {
        return {
            status: 'unavailable',
            message: 'App build SHA unavailable; cannot compare.',
        };
    }

    if (!docsSha) {
        return {
            status: 'unavailable',
            message: 'Docs RAG SHA unavailable; cannot compare.',
        };
    }

    if (shasMatch(appSha, docsSha)) {
        return {
            status: 'match',
            message: 'Docs RAG matches app build.',
        };
    }

    return {
        status: 'stale',
        message: 'Docs RAG is stale vs app build.',
    };
};

export const getDocsRagMismatchWarning = (appGitSha, docsGitSha) => {
    const comparison = getDocsRagComparison(appGitSha, docsGitSha);
    return comparison.status === 'stale' ? comparison.message : null;
};

const trimExcerpt = (text, maxChars) => {
    if (text.length <= maxChars) {
        return text;
    }

    const trimmedText = text.endsWith('…') ? text.slice(0, -1) : text;
    const clipped = trimmedText.slice(0, Math.max(0, maxChars - 1)).trimEnd();
    return clipped ? `${clipped}…` : '';
};

const buildMatchExcerpt = (text, regex, maxChars) => {
    const match = text.match(regex);
    if (!match) {
        return text;
    }

    const matchIndex =
        typeof match.index === 'number'
            ? match.index
            : text.toLowerCase().indexOf(String(match[0]).toLowerCase());
    if (matchIndex < 0) {
        return text;
    }

    const halfWindow = Math.floor(maxChars / 2);
    let start = Math.max(0, matchIndex - halfWindow);
    let end = Math.min(text.length, start + maxChars);

    if (end - start < maxChars) {
        start = Math.max(0, end - maxChars);
    }

    const snippet = text.slice(start, end).trim();
    const prefix = start > 0 ? '…' : '';
    const suffix = end < text.length ? '…' : '';
    return `${prefix}${snippet}${suffix}`;
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

const sanitizeExcerptText = (text) => {
    if (!text) {
        return '';
    }
    return text.replace(GITHUB_BLOB_PATTERN, '');
};

const parseChangelogYear = (value) => {
    const match = String(value || '').match(/^(\d{4})/);
    if (!match) {
        return null;
    }
    const year = Number(match[1]);
    return Number.isFinite(year) ? year : null;
};

const getLegacyMetaSets = (meta) => {
    const legacy = meta?.legacy || {};
    const docSlugs = new Set(legacy.docSlugs || []);
    const docPaths = new Set(legacy.docPaths || []);
    const changelogYears = new Set(legacy.changelogYears || []);
    return { docSlugs, docPaths, changelogYears };
};

const isLegacyChunk = (chunk, meta) => {
    const slug = String(chunk.slug || '');
    const path = String(chunk.path || '');
    const { docSlugs, docPaths, changelogYears } = getLegacyMetaSets(meta);

    if (docSlugs.has(slug) || docPaths.has(path)) {
        return true;
    }

    if (chunk.kind === 'changelog') {
        const year =
            parseChangelogYear(chunk.anchor) || parseChangelogYear(path.split('/changelog/')[1]);
        return year ? changelogYears.has(year) : false;
    }

    return slug.startsWith('/docs/legacy') || path.includes('/docs/md/legacy-');
};

const getChunkRankBoost = (chunk, query, meta) => {
    let boost = 0;
    const normalizedSlug = String(chunk.slug || '');
    const normalizedAnchor = resolveAnchor(chunk.anchor);
    const wantsLegacy = LEGACY_QUERY_INTENT.test(query);
    const legacyChunk = isLegacyChunk(chunk, meta);

    if (PRIORITY_DOC_SLUGS.has(normalizedSlug)) {
        boost += 1.5;
    }

    if (chunk.kind === 'changelog' && PRIORITY_CHANGELOG_ANCHORS.has(normalizedAnchor)) {
        boost += 1.5;
    }

    if (!legacyChunk) {
        boost += 0.4;
    } else if (!wantsLegacy) {
        boost -= 1.5;
    }

    return boost;
};

export const rankDocsResults = (results = [], chunkMap, meta, query) => {
    if (!Array.isArray(results) || results.length === 0) {
        return [];
    }

    return results
        .map((result) => {
            const chunk = chunkMap?.get(result.id);
            if (!chunk) {
                return { ...result, packGeneratedAt: meta?.generatedAt };
            }
            const boost = getChunkRankBoost(chunk, query, meta);
            return {
                ...result,
                score: result.score + boost,
                packGeneratedAt: meta?.generatedAt,
            };
        })
        .sort(compareResultsByRank);
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
    const leftGeneratedAt = Date.parse(left.packGeneratedAt || left.generatedAt || '');
    const rightGeneratedAt = Date.parse(right.packGeneratedAt || right.generatedAt || '');
    if (!Number.isNaN(leftGeneratedAt) && !Number.isNaN(rightGeneratedAt)) {
        if (leftGeneratedAt !== rightGeneratedAt) {
            return rightGeneratedAt - leftGeneratedAt;
        }
    }
    return compareIds(String(left.id), String(right.id));
};

const matchesSemanticsChunk = (chunk) => {
    const title = String(chunk.title || '');
    const heading = String(chunk.heading || '');
    return SEMANTICS_MATCH.test(`${title} ${heading}`);
};

const matchesCustomContentChunk = (chunk) => {
    const title = String(chunk.title || '');
    const heading = String(chunk.heading || '');
    const text = String(chunk.text || '');
    const combined = `${title} ${heading} ${text}`;
    return (
        CUSTOM_CONTENT_MATCH.test(combined) ||
        (CUSTOM_CONTENT_CONTEXT.test(combined) && CUSTOM_CONTENT_SIGNAL.test(combined))
    );
};

const matchesCustomContentFallbackChunk = (chunk) => {
    const title = String(chunk.title || '');
    const heading = String(chunk.heading || '');
    const text = String(chunk.text || '');
    const combined = `${title} ${heading} ${text}`;
    return (
        CUSTOM_CONTENT_FALLBACK_REQUIRED.test(combined) &&
        CUSTOM_CONTENT_FALLBACK_ACTION.test(combined) &&
        CUSTOM_CONTENT_SIGNAL.test(combined)
    );
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

const dropLowestRanked = (selected, predicate = () => true) => {
    if (!selected.length) return false;
    let lowestIndex = -1;
    for (let index = 0; index < selected.length; index += 1) {
        if (!predicate(selected[index])) {
            continue;
        }
        if (lowestIndex === -1) {
            lowestIndex = index;
            continue;
        }
        if (compareResultsByRank(selected[index], selected[lowestIndex]) < 0) {
            lowestIndex = index;
        }
    }
    if (lowestIndex === -1) {
        return false;
    }
    selected.splice(lowestIndex, 1);
    return true;
};

const includeForcedChunk = (selected, chunk, maxResults) => {
    if (!chunk) {
        return;
    }
    const existing = selected.find((entry) => entry.id === chunk.id);
    if (existing) {
        existing.forced = true;
        return;
    }
    if (selected.length >= maxResults) {
        const dropped = dropLowestRanked(selected, (entry) => !entry.forced);
        if (!dropped) {
            dropLowestRanked(selected);
        }
    }
    selected.push({ ...chunk, forced: true });
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
    const rawResults = miniSearch.search(query, SEARCH_OPTIONS).sort(compareResultsByRank);
    const results = rankDocsResults(rawResults, chunkMap, meta, query);
    const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
    const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
    const maxExcerptChars = options.maxExcerptChars ?? DEFAULT_MAX_EXCERPT_CHARS;

    const selected = [];
    for (const result of results) {
        const chunk = chunkMap.get(result.id);
        if (!chunk) continue;
        selected.push({
            ...chunk,
            score: result.score,
            forced: false,
            packGeneratedAt: result.packGeneratedAt,
        });
        if (selected.length >= maxResults) {
            break;
        }
    }

    const wantsRoutes = ROUTES_INTENT.test(query);
    const wantsChangelog = CHANGELOG_INTENT.test(query);
    const wantsDrift = DRIFT_INTENT.test(query) && DRIFT_VERSION_CUE.test(query);
    const wantsSemantics = SEMANTICS_INTENT.test(query);
    const wantsCustomContent = CUSTOM_CONTENT_INTENT.test(query);
    const wantsCustomContentRoute = wantsCustomContent && CUSTOM_CONTENT_ROUTE_SIGNAL.test(query);
    const wantsRouteChunk = wantsRoutes || wantsCustomContentRoute;

    if (wantsRouteChunk) {
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

    if (wantsDrift) {
        const preferredReleaseState =
            findHighestRankedChunk(
                results,
                chunkMap,
                (chunk) => chunk.kind === 'doc' && chunk.slug === '/docs/v3-release-state'
            ) ||
            findDeterministicChunk(
                chunkMap,
                (chunk) => chunk.kind === 'doc' && chunk.slug === '/docs/v3-release-state'
            );
        includeForcedChunk(selected, preferredReleaseState, maxResults);
    }

    if (wantsSemantics) {
        let semanticsChunk = findHighestRankedChunk(results, chunkMap, (chunk) => {
            return chunk.kind === 'doc' && matchesSemanticsChunk(chunk);
        });

        if (!semanticsChunk) {
            const semanticResults = miniSearch
                .search(SEMANTICS_FALLBACK_QUERY, SEARCH_OPTIONS)
                .sort(compareResultsByRank);
            const rankedSemantics = rankDocsResults(
                semanticResults,
                chunkMap,
                meta,
                SEMANTICS_FALLBACK_QUERY
            );
            semanticsChunk = findHighestRankedChunk(rankedSemantics, chunkMap, (chunk) => {
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
        let customContentChunk = findHighestRankedChunk(results, chunkMap, (chunk) => {
            return chunk.kind === 'doc' && matchesCustomContentChunk(chunk);
        });

        if (!customContentChunk) {
            const customContentResults = miniSearch
                .search(CUSTOM_CONTENT_FALLBACK_QUERY, SEARCH_OPTIONS)
                .sort(compareResultsByRank);
            const rankedCustomContent = rankDocsResults(
                customContentResults,
                chunkMap,
                meta,
                CUSTOM_CONTENT_FALLBACK_QUERY
            );
            customContentChunk = findHighestRankedChunk(rankedCustomContent, chunkMap, (chunk) => {
                return chunk.kind === 'doc' && matchesCustomContentChunk(chunk);
            });
        }

        if (!customContentChunk) {
            customContentChunk = findDeterministicChunk(chunkMap, (chunk) => {
                return chunk.kind === 'doc' && matchesCustomContentFallbackChunk(chunk);
            });
        }

        includeForcedChunk(selected, customContentChunk, maxResults);
    }

    selected.sort(compareResultsByRank);

    if (!selected.length) {
        return { excerptsText: '', sources: [], sourcesMeta: { results: [] } };
    }

    const docsGitSha = meta?.docsGitSha || meta?.gitSha || 'unknown';
    const generatedAt = meta?.generatedAt || 'unknown';
    const envName = meta?.envName || 'unknown';
    const sourceRef = meta?.sourceRef || 'unknown';
    const headerLines = [
        '---',
        `Docs grounding (env: ${envName}, docsGitSha: ${docsGitSha}, generatedAt: ${generatedAt}, sourceRef: ${sourceRef}):`,
    ];
    const header = `${headerLines.join('\n')}\n`;
    const footer = '---';
    const minBlockLength = header.length + footer.length;
    if (minBlockLength > maxChars) {
        return { excerptsText: '', sources: [], sourcesMeta: { results: [] } };
    }

    const buildExcerpts = (currentSelected) => {
        let outputText = header;
        const includedChunks = [];
        const orderedSelected = wantsCustomContentRoute
            ? [...currentSelected].sort((left, right) => {
                  if (left.kind === 'route' && right.kind !== 'route') {
                      return -1;
                  }
                  if (right.kind === 'route' && left.kind !== 'route') {
                      return 1;
                  }
                  return compareResultsByRank(left, right);
              })
            : currentSelected;

        for (const chunk of orderedSelected) {
            const routeExcerptChars = wantsRouteChunk
                ? Math.max(maxExcerptChars, 2500)
                : maxExcerptChars;
            const chunkMaxExcerptChars =
                chunk.kind === 'route' && wantsRouteChunk ? routeExcerptChars : maxExcerptChars;
            const rawText = sanitizeExcerptText(String(chunk.text || '').trim());

            const resolvedAnchor = resolveAnchor(chunk.anchor);
            const entryBase = buildEntry({
                kind: chunk.kind,
                title: chunk.title,
                slug: chunk.slug,
                anchor: resolvedAnchor,
                excerpt: '',
            });
            const entryOverhead = entryBase.length + 1;
            const availableForEntry = maxChars - outputText.length - footer.length;

            if (availableForEntry <= 0) {
                break;
            }

            if (entryOverhead > availableForEntry) {
                break;
            }

            const maxExcerptForEntry = Math.min(
                chunkMaxExcerptChars,
                availableForEntry - entryOverhead
            );
            if (maxExcerptForEntry <= 0) {
                continue;
            }

            const excerptText =
                chunk.kind === 'route' && wantsCustomContentRoute
                    ? buildMatchExcerpt(rawText, CUSTOM_CONTENT_BACKUP_MATCH, maxExcerptForEntry)
                    : rawText;
            const excerpt = trimExcerpt(excerptText, maxExcerptForEntry);
            if (!excerpt) {
                continue;
            }

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

            outputText += entry;
            includedChunks.push({ ...chunk, anchor: resolvedAnchor });
        }

        return { outputText, includedChunks };
    };

    const forcedIds = new Set(selected.filter((chunk) => chunk.forced).map((chunk) => chunk.id));
    let output = '';
    let included = [];
    let remaining = selected;
    let attempts = 0;

    while (attempts <= selected.length) {
        const { outputText, includedChunks } = buildExcerpts(remaining);
        output = outputText;
        included = includedChunks;

        if (!forcedIds.size) {
            break;
        }

        const includedForcedIds = new Set(
            included.filter((chunk) => forcedIds.has(chunk.id)).map((chunk) => chunk.id)
        );
        const missingForced = [...forcedIds].filter((id) => !includedForcedIds.has(id));
        if (!missingForced.length) {
            break;
        }

        const dropped = dropLowestRanked(remaining, (chunk) => !chunk.forced);
        if (!dropped) {
            break;
        }
        remaining.sort(compareResultsByRank);
        attempts += 1;
    }

    if (!included.length) {
        return { excerptsText: '', sources: [], sourcesMeta: { results: [] } };
    }

    output += footer;

    const sourcesMeta = {
        envName,
        sourceRef,
        docsGitSha,
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
