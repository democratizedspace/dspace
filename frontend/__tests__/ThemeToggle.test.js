/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from '@jest/globals';

const toggleFile = path.join(__dirname, '../src/components/svelte/ThemeToggle.svelte');

describe('ThemeToggle.svelte', () => {
    it('uses compact label text to reduce header overlap risk', () => {
        const content = fs.readFileSync(toggleFile, 'utf8');
        expect(content).toMatch(/\.theme-toggle__text {\n\s*font-size: 0\.8rem;/);
        expect(content).toMatch(/white-space: nowrap;/);
    });
});
