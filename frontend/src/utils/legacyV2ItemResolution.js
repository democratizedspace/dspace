import { LEGACY_V1_ITEM_MAPPINGS, V1_ITEM_ID_TO_V3_UUID } from './legacyV1ItemIdMap.js';
import { UUID_REGEX } from './uuid.js';

export const resolveLegacyV2ItemBase = (rawId) => {
    if (rawId === null || rawId === undefined) return null;
    const trimmed = String(rawId).trim();
    if (!trimmed) return null;
    if (UUID_REGEX.test(trimmed)) {
        return {
            v2Id: trimmed,
            v3Id: trimmed,
            source: 'uuid',
            mapping: null,
        };
    }

    if (!/^\d+$/.test(trimmed)) return null;
    const numeric = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(numeric)) return null;
    const mapping = LEGACY_V1_ITEM_MAPPINGS.find((entry) => entry.v1Id === numeric) ?? null;
    const v3Id = mapping?.v3Id ?? V1_ITEM_ID_TO_V3_UUID[numeric] ?? trimmed;

    return {
        v2Id: trimmed,
        v3Id,
        source: 'numeric',
        mapping,
        numericId: numeric,
    };
};
