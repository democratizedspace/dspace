/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const pageFile = path.join(__dirname, '../src/components/Page.astro');

describe('Page.astro', () => {
    it('exposes main landmark for skip navigation', () => {
        const content = fs.readFileSync(pageFile, 'utf8');
        expect(content).toMatch(/<main id="main">/);
    });

    it('wraps page content in a consistent container', () => {
        const content = fs.readFileSync(pageFile, 'utf8');
        expect(content).toMatch(/class="page-shell"/);
        expect(content).toMatch(/class="page-content"/);
    });
});
