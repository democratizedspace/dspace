import { describe, expect, it } from 'vitest';
import items from '../src/pages/inventory/json/items/index.js';

// Regression coverage for OUT-2025-12-05-inventory-items-not-displaying
// Verifies JSON imports using `assert { type: "json" }` still load correctly
// and surface inventory data to the UI.
describe('inventory items import assertions', () => {
    it('loads inventory items without throwing', () => {
        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBeGreaterThan(0);
    });

    it('tags items with expected categories', () => {
        const categories = Array.from(new Set(items.map((item) => item.category))).sort();
        expect(categories).toEqual([
            '3D Printing',
            'Aquarium',
            'Astronomy',
            'Awards',
            'Electronics & Computing',
            'Energy',
            'Health & Safety',
            'Hydroponics',
            'Laboratory',
            'Mobility',
            'Office & Media',
            'Rocketry',
            'Tokens',
            'Tools',
            'Workshop',
        ]);
    });

    it('includes representative inventory entries', () => {
        const names = items.map((item) => item.name.toLowerCase());
        expect(names).toContain('aquarium (150 l)');
        expect(names).toContain('benchy award');
        expect(names).toContain('hydroponics kit');
        expect(names).toContain('entry-level fdm 3d printer');
        expect(names).toContain('white pla filament');
    });
});
