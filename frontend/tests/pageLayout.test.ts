import { readFileSync } from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Page layout component', () => {
    it('exposes stable layout hooks for regression checks', () => {
        const pagePath = path.join(process.cwd(), 'frontend', 'src', 'components', 'Page.astro');
        const source = readFileSync(pagePath, 'utf8');

        expect(source).toContain('data-page-shell');
        expect(source).toContain('data-page-content');
    });

    it('keeps the content wrapper configurable', () => {
        const pagePath = path.join(process.cwd(), 'frontend', 'src', 'components', 'Page.astro');
        const source = readFileSync(pagePath, 'utf8');

        expect(source).toMatch(/contentTag/);
        expect(source).toMatch(/ContentTag/);
    });
});
