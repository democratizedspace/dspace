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
const LEGACY_QUERY_CUES = /\b(v1|v2|legacy|2022|2023|old(?:er)?)\b/i;
const LEGACY_CHANGELOG_ANCHOR = /^202[0-3]/;
const PREFERRED_DOC_SLUGS = new Set(['/docs/v3-release-state', '/docs/routes', '/docs/backups']);
const PREFERRED_CHANGELOG_ANCHORS = new Set(['20260301']);
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
const normalizeDisplaySha = (value) => {
    const normalized = normalizeSha(value);
    if (!normalized || normalized.toLowerCase() === 'unknown') {
        return 'unavailable';
    }
    return normalized;
};
const normalizeComparableSha = (value) => {
    const normalized = normalizeSha(value);
    if (!normalized) {
        return '';
    }
    const lower = normalized.toLowerCase();
    if (
        lower === 'unknown' ||
        lower === 'unavailable' ||
        lower === 'dev-local' ||
        lower === 'docs-pack-fallback' ||
        lower === 'missing' ||
        lower === 'missing-sha'
    ) {
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

const normalizeEnvName = (value) => {
    const normalized = String(value || '')
        .trim()
        .toLowerCase();
    if (!normalized) {
        return null;
    }
    if (['production', 'prod'].includes(normalized)) {
        return 'prod';
    }
    if (['staging', 'stage', 'stg'].includes(normalized)) {
        return 'staging';
    }
    if (['dev', 'development', 'local'].includes(normalized)) {
        return 'dev';
    }
    return normalized;
};

export const getDocsRagComparison = (appGitSha, docsGitSha, options = {}) => {
    const appLabel = normalizeDisplaySha(appGitSha);
    const docsLabel = normalizeDisplaySha(docsGitSha);
    const appSha = normalizeComparableSha(appGitSha);
    const docsSha = normalizeComparableSha(docsGitSha);
    const appShaIsReal = options.appShaIsReal ?? Boolean(appSha);
    const docsShaIsReal = options.docsShaIsReal ?? Boolean(docsSha);
    const hasAppSha = Boolean(appShaIsReal && appSha);
    const hasDocsSha = Boolean(docsShaIsReal && docsSha);
    const bothValid = hasAppSha && hasDocsSha;
    const inSync = Boolean(bothValid && shasMatch(appSha, docsSha));
    const envName = normalizeEnvName(options.envName);
    const isDeployed = envName === 'staging' || envName === 'prod';

    if (isDeployed && !appShaIsReal) {
        return {
            status: 'unavailable',
            message: '⚠️ cannot verify app/docs sync (app SHA missing)',
        };
    }

    if (inSync) {
        return {
            status: 'match',
            message: `✅ in sync (app: ${appLabel}, docs: ${docsLabel})`,
        };
    }

    if (bothValid) {
        return {
            status: 'mismatch',
            message: `⚠️ mismatch (app: ${appLabel}, docs: ${docsLabel})`,
        };
    }

    if (!hasAppSha && hasDocsSha) {
        return {
            status: 'assumed',
            message: `ℹ️ app SHA missing; using docs pack SHA for display (docs: ${docsLabel})`,
        };
    }

    if (hasAppSha && !hasDocsSha) {
        return {
            status: 'unavailable',
            message: `ℹ️ docs SHA unavailable (app: ${appLabel}, docs: ${docsLabel})`,
        };
    }

    return {
        status: 'unavailable',
        message: `ℹ️ app/docs SHAs unavailable (app: ${appLabel}, docs: ${docsLabel})`,
    };
};

export const getDocsRagMismatchWarning = (appGitSha, docsGitSha, options = {}) => {
    const comparison = getDocsRagComparison(appGitSha, docsGitSha, options);
    return comparison.status === 'mismatch' ? comparison.message : null;
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

const compareIds = (leftId, rightId) => {
    if (leftId < rightId) return -1;
    if (leftId > rightId) return 1;
    return 0;
};

const SCORE_EPSILON = 1e-6;

const parseGeneratedAt = (value) => {
    if (!value) return null;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const compareByGeneratedAt = (leftMeta, rightMeta) => {
    const leftTime = parseGeneratedAt(leftMeta?.generatedAt);
    const rightTime = parseGeneratedAt(rightMeta?.generatedAt);
    if (leftTime == null || rightTime == null || leftTime === rightTime) {
        return 0;
    }
    return rightTime - leftTime;
};

const compareResultsByRank = (left, right) => {
    const scoreDelta = right.score - left.score;
    if (Math.abs(scoreDelta) > SCORE_EPSILON) {
        return scoreDelta;
    }
    const generatedAtComparison = compareByGeneratedAt(left?.meta, right?.meta);
    if (generatedAtComparison !== 0) {
        return generatedAtComparison;
    }
    return compareIds(String(left.id), String(right.id));
};

const buildLegacyAnchors = (meta) =>
    new Set((meta?.legacy?.changelogAnchors || []).map((entry) => String(entry || '').trim()));

const isLegacyChangelogChunk = (chunk, legacyAnchors) => {
    if (!chunk || chunk.kind !== 'changelog') {
        return false;
    }
    const anchor = resolveAnchor(chunk.anchor);
    if (legacyAnchors.has(anchor)) {
        return true;
    }
    return LEGACY_CHANGELOG_ANCHOR.test(anchor);
};

const getDocsRankBoost = ({ chunk, wantsLegacy, legacyAnchors }) => {
    if (!chunk) {
        return 0;
    }

    let boost = 0;

    if (chunk.kind === 'doc' && PREFERRED_DOC_SLUGS.has(chunk.slug)) {
        boost += 1.5;
    }

    if (chunk.kind === 'route' && chunk.slug === '/docs/routes') {
        boost += 1.2;
    }

    const anchor = resolveAnchor(chunk.anchor);
    if (chunk.kind === 'changelog' && PREFERRED_CHANGELOG_ANCHORS.has(anchor)) {
        boost += 1.4;
    }

    const isLegacy = isLegacyChangelogChunk(chunk, legacyAnchors);
    if (isLegacy) {
        boost += wantsLegacy ? 0.4 : -2.0;
    }

    return boost;
};

export const rankDocsResults = ({ results, chunkMap, query, meta }) => {
    const wantsLegacy = LEGACY_QUERY_CUES.test(String(query || ''));
    const legacyAnchors = buildLegacyAnchors(meta);

    return results
        .map((result) => {
            const chunk = chunkMap.get(result.id);
            const boost = getDocsRankBoost({ chunk, wantsLegacy, legacyAnchors });
            const resultMeta = result.meta ?? meta ?? null;
            return { ...result, score: result.score + boost, meta: resultMeta };
        })
        .sort(compareResultsByRank);
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
    const rawResults = miniSearch.search(query, SEARCH_OPTIONS);
    const results = rankDocsResults({ results: rawResults, chunkMap, query, meta });
    const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
    const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
    const maxExcerptChars = options.maxExcerptChars ?? DEFAULT_MAX_EXCERPT_CHARS;

    const selected = [];
    for (const result of results) {
        const chunk = chunkMap.get(result.id);
        if (!chunk) continue;
        selected.push({ ...chunk, score: result.score, forced: false, meta: result.meta });
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
            const semanticResults = rankDocsResults({
                results: miniSearch.search(SEMANTICS_FALLBACK_QUERY, SEARCH_OPTIONS),
                chunkMap,
                query: SEMANTICS_FALLBACK_QUERY,
                meta,
            });
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
        let customContentChunk = findHighestRankedChunk(results, chunkMap, (chunk) => {
            return chunk.kind === 'doc' && matchesCustomContentChunk(chunk);
        });

        if (!customContentChunk) {
            const customContentResults = rankDocsResults({
                results: miniSearch.search(CUSTOM_CONTENT_FALLBACK_QUERY, SEARCH_OPTIONS),
                chunkMap,
                query: CUSTOM_CONTENT_FALLBACK_QUERY,
                meta,
            });
            customContentChunk = findHighestRankedChunk(customContentResults, chunkMap, (chunk) => {
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
    const sourceRef = meta?.sourceRef ? `, sourceRef: ${meta.sourceRef}` : '';
    const headerLines = [
        '---',
        `Docs grounding (env: ${envName}, gitSha: ${docsGitSha}, generatedAt: ${generatedAt}${sourceRef}):`,
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
            const rawText = String(chunk.text || '').trim();

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
        gitSha: docsGitSha,
        docsGitSha,
        generatedAt,
        envName,
        sourceRef: meta?.sourceRef || null,
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
