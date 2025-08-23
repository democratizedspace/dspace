/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const layoutFile = path.join(__dirname, '../src/layouts/Layout.astro');

describe('Layout accessibility', () => {
    it('includes a skip link for keyboard navigation', () => {
        const content = fs.readFileSync(layoutFile, 'utf8');
        expect(content).toMatch(
            /<a class="skip-link" href="#main-content" aria-label="Skip to main content">Skip to main content<\/a>/
        );
    });

    it('wraps slot content in a semantic main element', () => {
        const content = fs.readFileSync(layoutFile, 'utf8');
        expect(content).toMatch(/<main id="main-content">/);
    });
});
