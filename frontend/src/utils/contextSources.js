/**
 * @typedef {'item'|'process'|'quest'|'achievement'|'doc'|'route'|'changelog'|'state'} SourceType
 */

/**
 * @typedef {Object} Source
 * @property {SourceType} type
 * @property {string} id
 * @property {string} label
 * @property {string=} url
 * @property {string=} detail
 */

const toSourceKey = (source) => `${source.type}::${source.id}::${source.url ?? ''}`;

const normalizeSource = (source) => {
    if (!source || typeof source !== 'object') return null;
    const type = source.type;
    const id = source.id != null ? String(source.id) : '';
    const label = source.label != null ? String(source.label) : '';
    const url = source.url ? String(source.url) : undefined;
    const detail = source.detail ? String(source.detail) : undefined;

    if (!type || !id || !label) return null;

    return {
        type,
        id,
        label,
        url,
        detail,
    };
};

export const dedupeSources = (sources = []) => {
    const map = new Map();

    for (const source of sources) {
        const normalized = normalizeSource(source);
        if (!normalized) continue;
        const key = toSourceKey(normalized);
        if (!map.has(key)) {
            map.set(key, normalized);
        }
    }

    return Array.from(map.values());
};

export const sortSources = (sources = []) => {
    return [...sources].sort((a, b) => {
        const typeCompare = a.type.localeCompare(b.type);
        if (typeCompare !== 0) return typeCompare;
        const labelCompare = (a.label || '').localeCompare(b.label || '');
        if (labelCompare !== 0) return labelCompare;
        return String(a.id).localeCompare(String(b.id));
    });
};

export const mergeSources = (...sourceGroups) => {
    return sortSources(dedupeSources(sourceGroups.flat()));
};
