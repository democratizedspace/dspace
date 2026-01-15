import { describe, it, expect } from 'vitest';
import { buildFullItemList, getItemMetadata } from '../frontend/src/components/svelte/compactItemListHelpers.js';

const DCARBON_ID = 'd88ef09c-9191-4c18-8628-a888bb9f926d';
const DUSD_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';

describe('compact item list helpers', () => {
    it('keeps grant items visible even when totals are zero', () => {
        const fullList = buildFullItemList(
            [
                { id: DCARBON_ID, count: 10 },
                { id: DUSD_ID, count: 100 },
            ],
            {
                [DCARBON_ID]: 0,
                [DUSD_ID]: 0,
            }
        );

        expect(fullList).toHaveLength(2);
        expect(fullList[0].total).toBe(0);
        expect(fullList[0].count).toBe(10);
        expect(fullList[1].count).toBe(100);
    });

    it('returns fallback metadata for custom items', () => {
        const customMeta = getItemMetadata({ id: 'custom-quest-item', name: 'Custom Quest Item' });

        expect(customMeta.name).toBe('Custom Quest Item');
        expect(customMeta.image).toBeNull();
        expect(customMeta.description).toBe('');
        expect(customMeta.isLoading).toBe(true);
    });
});
