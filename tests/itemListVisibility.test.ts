import { describe, expect, it } from 'vitest';
import { hasRenderableItems } from '../frontend/src/components/svelte/utils/itemListVisibility.js';

describe('hasRenderableItems', () => {
    it('returns true when item definitions are present', () => {
        expect(
            hasRenderableItems([
                { id: 'd88ef09c-9191-4c18-8628-a888bb9f926d', count: 10 },
                { id: '5247a603-294a-4a34-a884-1ae20969b2a1', count: 100 },
            ])
        ).toBe(true);
    });

    it('returns false when the list is empty or not an array', () => {
        expect(hasRenderableItems([])).toBe(false);
        expect(hasRenderableItems(undefined)).toBe(false);
        expect(hasRenderableItems(null)).toBe(false);
    });
});
