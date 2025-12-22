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
        const categories = new Set(items.map((item) => item.category));
        expect(categories).toEqual(
            new Set([
                '3D Printing & Fabrication',
                'Aquarium',
                'Astronomy & Observation',
                'Awards',
                'Biology & Lab',
                'Digital & Records',
                'Digital Currency & Tokens',
                'Electronics & Robotics',
                'Energy & Power',
                'Hydroponics',
                'Rocketry & Flight',
                'Safety & Medical',
                'Tools',
                'Transportation',
                'Workshop & Construction',
            ])
        );
    });

    it('never falls back to the deprecated "Misc" label', () => {
        const categories = items.map((item) => item.category);

        categories.forEach((category) => {
            expect(typeof category === 'string' && category.trim().length > 0).toBe(true);
            expect(category).not.toBe('Misc');
        });
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
