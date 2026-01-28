import MiniSearch from 'minisearch';
import { isBrowser } from './ssr.js';

const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_MAX_CHARS = 5000;
const DEFAULT_MAX_EXCERPT_CHARS = 800;

const MINI_SEARCH_OPTIONS = {
    idField: 'id',
    fields: ['title', 'heading', 'text', 'slug', 'path'],
    storeFields: ['id', 'slug', 'title', 'heading', 'anchor', 'kind', 'path'],
    searchOptions: {
        boost: { title: 3, heading: 2 },
    },
};

let ragIndexPromise = null;

const toModuleDefault = (moduleValue) => moduleValue?.default ?? moduleValue;

const loadDocsRagIndex = async () => {
    if (!ragIndexPromise) {
        ragIndexPromise = (async () => {
            const [chunksModule, indexModule, metaModule] = await Promise.all([
                import('../generated/rag/docs_chunks.json'),
                import('../generated/rag/docs_index.json'),
                import('../generated/rag/docs_meta.json'),
            ]);

            const chunks = toModuleDefault(chunksModule) ?? [];
            const indexJson = toModuleDefault(indexModule);
            const meta = toModuleDefault(metaModule) ?? {};
            let miniSearch;

            try {
                miniSearch = MiniSearch.loadJSON(indexJson, MINI_SEARCH_OPTIONS);
            } catch (error) {
                miniSearch = new MiniSearch(MINI_SEARCH_OPTIONS);
                miniSearch.addAll(chunks);
            }

            const chunkMap = new Map(chunks.map((chunk) => [chunk.id, chunk]));

            return { miniSearch, chunkMap, meta };
        })();
    }

    return ragIndexPromise;
};

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const clampNumber = (value, fallback) => {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return value;
    }
    return fallback;
};

const trimText = (value, maxChars) => {
    const text = normalizeText(value);
    if (!text) {
        return '';
    }
    if (text.length <= maxChars) {
        return text;
    }
    return `${text.slice(0, Math.max(1, maxChars - 1)).trim()}…`;
};

const formatChunkUrl = (chunk) => {
    if (!chunk?.slug) {
        return '';
    }
    if (chunk.anchor) {
        return `${chunk.slug}#${chunk.anchor}`;
    }
    return chunk.slug;
};

const kindLabel = (kind) => {
    switch (kind) {
        case 'route':
            return 'route';
        case 'changelog':
            return 'changelog';
        default:
            return 'doc';
    }
};

export const searchDocsRag = async (queryText, options = {}) => {
    const query = String(queryText || '').trim();

    if (!query || !isBrowser) {
        return { excerptsText: '', sourcesMeta: [] };
    }

    const { miniSearch, chunkMap, meta } = await loadDocsRagIndex();
    const maxResults = clampNumber(options.maxResults, DEFAULT_MAX_RESULTS);
    const maxChars = clampNumber(options.maxChars, DEFAULT_MAX_CHARS);
    const maxExcerptChars = clampNumber(options.maxExcerptChars, DEFAULT_MAX_EXCERPT_CHARS);

    const results = miniSearch.search(query, { prefix: true }).slice(0, maxResults);
    const sourcesMeta = [];
    const entries = [];

    const gitSha = meta?.gitSha || 'unknown';
    const header = `Docs grounding (gitSha: ${gitSha}):`;
    const baseHeader = `---\n${header}\n`;
    const baseFooter = '\n---';
    let remainingChars = maxChars - baseHeader.length - baseFooter.length;

    if (remainingChars <= 0) {
        return { excerptsText: '', sourcesMeta: [] };
    }

    for (const result of results) {
        const chunk = chunkMap.get(result.id);
        if (!chunk) {
            continue;
        }

        const url = formatChunkUrl(chunk);
        if (!url) {
            continue;
        }

        const title = chunk.title || chunk.heading || chunk.slug || 'Untitled';
        const excerpt = trimText(chunk.text, Math.min(maxExcerptChars, remainingChars));
        if (!excerpt) {
            continue;
        }

        const entry = `- [${kindLabel(chunk.kind)}] ${title} — ${url}\n  ${excerpt}`;
        const entryLength = entry.length + 1;

        if (entryLength > remainingChars) {
            break;
        }

        entries.push(entry);
        remainingChars -= entryLength;
        sourcesMeta.push({
            id: chunk.id,
            kind: chunk.kind,
            slug: chunk.slug,
            anchor: chunk.anchor,
            title: chunk.title,
            heading: chunk.heading,
            path: chunk.path,
        });
    }

    if (!entries.length) {
        return { excerptsText: '', sourcesMeta: [] };
    }

    const excerptsText = `${baseHeader}${entries.join('\n')}\n---`;

    return { excerptsText, sourcesMeta };
};
