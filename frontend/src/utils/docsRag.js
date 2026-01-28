import MiniSearch from 'minisearch';
import { isBrowser } from './ssr.js';

const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_MAX_CHARS = 5000;
const DEFAULT_EXCERPT_CHARS = 800;
const SEARCH_FIELDS = ['title', 'heading', 'text', 'slug', 'path'];
const STORE_FIELDS = ['id', 'slug', 'title', 'heading', 'anchor', 'kind', 'path'];
const SEARCH_OPTIONS = {
    boost: { title: 3, heading: 2 },
    prefix: true,
};

let ragStatePromise;

const isTestEnv = () => typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';

const loadDocsRagArtifacts = async () => {
    const [chunksResult, indexResult, metaResult] = await Promise.allSettled([
        import('../generated/rag/docs_chunks.json'),
        import('../generated/rag/docs_index.json'),
        import('../generated/rag/docs_meta.json'),
    ]);

    if (chunksResult.status !== 'fulfilled') {
        return null;
    }

    const chunksModule = chunksResult.value;
    const indexModule = indexResult.status === 'fulfilled' ? indexResult.value : null;
    const metaModule = metaResult.status === 'fulfilled' ? metaResult.value : null;

    return {
        chunks: chunksModule.default ?? chunksModule,
        indexJson: indexModule ? (indexModule.default ?? indexModule) : null,
        meta: metaModule ? (metaModule.default ?? metaModule) : null,
    };
};

const buildMiniSearch = (chunks, indexJson) => {
    if (indexJson && typeof MiniSearch.loadJSON === 'function') {
        try {
            const serializedIndex =
                typeof indexJson === 'string' ? indexJson : JSON.stringify(indexJson);
            return MiniSearch.loadJSON(serializedIndex, {
                fields: SEARCH_FIELDS,
                storeFields: STORE_FIELDS,
                searchOptions: SEARCH_OPTIONS,
            });
        } catch (error) {
            console.warn('MiniSearch load failed, rebuilding index from chunks.', error);
        }
    }

    const miniSearch = new MiniSearch({
        idField: 'id',
        fields: SEARCH_FIELDS,
        storeFields: STORE_FIELDS,
        searchOptions: SEARCH_OPTIONS,
    });
    miniSearch.addAll(chunks);
    return miniSearch;
};

const initDocsRag = async () => {
    if (!isBrowser && !isTestEnv()) {
        return null;
    }

    const artifacts = await loadDocsRagArtifacts();
    if (!artifacts?.chunks) {
        return null;
    }

    const chunks = artifacts.chunks || [];
    const chunksById = new Map(chunks.map((chunk) => [chunk.id, chunk]));
    const miniSearch = buildMiniSearch(chunks, artifacts.indexJson);

    return {
        chunks,
        chunksById,
        miniSearch,
        meta: artifacts.meta || {},
    };
};

const ensureRagState = async () => {
    if (!ragStatePromise) {
        ragStatePromise = initDocsRag();
    }

    return ragStatePromise;
};

const trimExcerpt = (text, maxLength) => {
    if (!text || typeof text !== 'string') {
        return '';
    }
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) {
        return normalized;
    }
    return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
};

const summarizeResult = (result, chunk) => {
    const title = result.title || chunk?.title || result.heading || chunk?.heading || 'Untitled';
    const anchor = result.anchor || chunk?.anchor || 'top';
    const slug = result.slug || chunk?.slug || '';
    const kind = result.kind || chunk?.kind || 'doc';
    const url = slug ? `${slug}#${anchor}` : '';

    return {
        id: result.id,
        kind,
        title,
        anchor,
        slug,
        url,
        excerpt: chunk?.text || '',
    };
};

const pickDiverseResults = (results, chunksById, maxResults) => {
    const chosen = [];
    const seen = new Set();
    const kinds = ['doc', 'route', 'changelog'];

    for (const kind of kinds) {
        const match = results.find((result) => {
            const chunk = chunksById.get(result.id);
            return (result.kind || chunk?.kind) === kind;
        });
        if (match && !seen.has(match.id)) {
            chosen.push(match);
            seen.add(match.id);
        }
    }

    for (const result of results) {
        if (chosen.length >= maxResults) {
            break;
        }
        if (!seen.has(result.id)) {
            chosen.push(result);
            seen.add(result.id);
        }
    }

    return chosen.slice(0, maxResults);
};

export const searchDocsRag = async (queryText, options = {}) => {
    const query = typeof queryText === 'string' ? queryText.trim() : '';
    if (!query) {
        return { excerptsText: '', sourcesMeta: { sources: [], gitSha: null } };
    }

    const ragState = await ensureRagState();
    if (!ragState?.miniSearch) {
        return { excerptsText: '', sourcesMeta: { sources: [], gitSha: null } };
    }

    const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
    const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
    const maxExcerptChars = options.maxExcerptChars ?? DEFAULT_EXCERPT_CHARS;

    const results = ragState.miniSearch.search(query, SEARCH_OPTIONS);
    const selected = pickDiverseResults(results, ragState.chunksById, maxResults);

    const sources = selected
        .map((result) => {
            const chunk = ragState.chunksById.get(result.id);
            return summarizeResult(result, chunk);
        })
        .filter((entry) => entry.slug && entry.anchor);

    if (!sources.length) {
        return { excerptsText: '', sourcesMeta: { sources: [], gitSha: ragState.meta?.gitSha } };
    }

    const header = `Docs grounding (gitSha: ${ragState.meta?.gitSha || 'unknown'}):`;
    const lines = ['---', header];
    let usedChars = lines.join('\n').length + 1;

    for (const source of sources) {
        if (usedChars >= maxChars) {
            break;
        }

        const line = `- [${source.kind}] ${source.title} — ${source.url}`;
        const trimmedExcerpt = trimExcerpt(source.excerpt, maxExcerptChars);
        const excerptLine = trimmedExcerpt ? `  ${trimmedExcerpt}` : '';
        const candidateLines = excerptLine ? [line, excerptLine] : [line];
        const candidateText = candidateLines.join('\n');
        const candidateLength = candidateText.length + 1;

        if (usedChars + candidateLength > maxChars && lines.length > 2) {
            break;
        }

        lines.push(...candidateLines);
        usedChars += candidateLength;
    }

    lines.push('---');

    return {
        excerptsText: lines.join('\n'),
        sourcesMeta: {
            gitSha: ragState.meta?.gitSha || null,
            sources,
        },
    };
};
