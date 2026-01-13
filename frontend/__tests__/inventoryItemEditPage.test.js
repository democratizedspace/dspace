/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const pageFile = path.join(__dirname, '../src/pages/inventory/item/[itemId]/edit.astro');

describe('inventory item edit page', () => {
    it('loads the edit item component', () => {
        const content = fs.readFileSync(pageFile, 'utf8');
        expect(content).toContain("import EditItem from '../../svelte/EditItem.svelte'");
        expect(content).toMatch(/<EditItem client:load/);
    });
});
