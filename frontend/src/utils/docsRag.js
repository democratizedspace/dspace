import MiniSearch from 'minisearch';

const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_MAX_CHARS = 5200;
const DEFAULT_MAX_EXCERPT_CHARS = 800;
const INDEX_FIELDS = ['title', 'heading', 'text', 'slug', 'path'];
const STORE_FIELDS = ['id', 'slug', 'title', 'heading', 'anchor', 'kind', 'path'];
const SEARCH_OPTIONS = {
    boost: { title: 3, heading: 2 },
};

let cachedArtifacts = null;
let artifactsPromise = null;

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const trimToLength = (text, maxLength) => {
    const normalized = normalizeText(text);
    if (normalized.length <= maxLength) {
        return normalized;
    }
    return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
};

const buildMiniSearch = (chunks) => {
    const miniSearch = new MiniSearch({
        idField: 'id',
        fields: INDEX_FIELDS,
        storeFields: STORE_FIELDS,
        searchOptions: SEARCH_OPTIONS,
    });

    miniSearch.addAll(chunks);

    return miniSearch;
};

const loadArtifacts = async () => {
    if (cachedArtifacts) {
        return cachedArtifacts;
    }

    if (artifactsPromise) {
        return artifactsPromise;
    }

    artifactsPromise = (async () => {
        const [chunksModule, indexModule, metaModule] = await Promise.all([
            import('../generated/rag/docs_chunks.json', { assert: { type: 'json' } }),
            import('../generated/rag/docs_index.json', { assert: { type: 'json' } }),
            import('../generated/rag/docs_meta.json', { assert: { type: 'json' } }),
        ]);

        const chunks = chunksModule.default ?? chunksModule;
        const indexJson = indexModule.default ?? indexModule;
        const meta = metaModule.default ?? metaModule;
        const chunkMap = new Map(chunks.map((chunk) => [chunk.id, chunk]));

        let miniSearch;
        if (typeof MiniSearch.loadJSON === 'function') {
            try {
                miniSearch = MiniSearch.loadJSON(indexJson, {
                    idField: 'id',
                    fields: INDEX_FIELDS,
                    storeFields: STORE_FIELDS,
                    searchOptions: SEARCH_OPTIONS,
                });
            } catch (error) {
                console.warn('Docs RAG index restore failed, rebuilding search index.', error);
            }
        }

        if (!miniSearch) {
            miniSearch = buildMiniSearch(chunks);
        }

        cachedArtifacts = {
            chunks,
            chunkMap,
            miniSearch,
            meta,
        };

        return cachedArtifacts;
    })();

    return artifactsPromise;
};

const buildUrl = (chunk) => {
    const slug = chunk?.slug || '';
    const anchor = chunk?.anchor ? String(chunk.anchor).replace(/^#/, '') : 'top';
    return `${slug}#${anchor}`;
};

const selectResults = (results, chunkMap, maxResults) => {
    if (!Array.isArray(results) || results.length === 0) {
        return [];
    }

    const ranked = results
        .filter((result) => chunkMap.has(result.id))
        .map((result) => ({
            ...result,
            chunk: chunkMap.get(result.id),
        }));

    const picked = [];
    const pickedIds = new Set();
    const pickedKinds = new Set();

    for (const result of ranked) {
        if (pickedIds.size >= maxResults) {
            break;
        }
        const kind = result.chunk?.kind;
        if (!kind || pickedKinds.has(kind)) {
            continue;
        }
        picked.push(result);
        pickedIds.add(result.id);
        pickedKinds.add(kind);
    }

    for (const result of ranked) {
        if (pickedIds.size >= maxResults) {
            break;
        }
        if (pickedIds.has(result.id)) {
            continue;
        }
        picked.push(result);
        pickedIds.add(result.id);
    }

    return picked;
};

export const searchDocsRag = async (queryText, options = {}) => {
    const query = normalizeText(queryText);
    if (!query) {
        return { excerptsText: '', sourcesMeta: null, results: [] };
    }

    const { maxResults = DEFAULT_MAX_RESULTS, maxChars = DEFAULT_MAX_CHARS } = options;

    const { chunkMap, miniSearch, meta } = await loadArtifacts();
    const results = miniSearch.search(query, {
        prefix: true,
        fuzzy: 0.2,
    });

    const selected = selectResults(results, chunkMap, maxResults);
    if (selected.length === 0) {
        return { excerptsText: '', sourcesMeta: { gitSha: meta?.gitSha }, results: [] };
    }

    const lines = ['---', `Docs grounding (gitSha: ${meta?.gitSha ?? 'unknown'}):`];
    let remaining = maxChars - lines.join('\n').length - 1;

    const entries = [];
    for (const result of selected) {
        if (remaining <= 0) {
            break;
        }
        const chunk = result.chunk;
        const label = chunk.kind || 'doc';
        const title = chunk.title || chunk.heading || chunk.slug || 'Untitled';
        const url = buildUrl(chunk);
        const excerpt = trimToLength(chunk.text || '', DEFAULT_MAX_EXCERPT_CHARS);
        const entry = `- [${label}] ${title} — ${url}\n  ${excerpt}`;
        if (entry.length + 1 > remaining) {
            break;
        }
        entries.push(entry);
        remaining -= entry.length + 1;
    }

    if (entries.length === 0) {
        return { excerptsText: '', sourcesMeta: { gitSha: meta?.gitSha }, results: [] };
    }

    const excerptsText = `${lines.join('\n')}\n${entries.join('\n')}\n---`;
    return {
        excerptsText,
        sourcesMeta: { gitSha: meta?.gitSha, counts: meta?.counts },
        results: selected,
    };
};
