/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const pageFile = path.join(__dirname, '../src/pages/inventory/manage.astro');

describe('inventory manage page', () => {
    it('loads ManageItems component', () => {
        const content = fs.readFileSync(pageFile, 'utf8');
        expect(content).toMatch(/import ManageItems from '.\/svelte\/ManageItems\.svelte'/);
        expect(content).toMatch(/<ManageItems client:load/);
    });
});
