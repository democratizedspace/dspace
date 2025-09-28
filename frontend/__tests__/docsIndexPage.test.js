/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const docsIndexFile = path.join(__dirname, '../src/pages/docs/index.astro');
const docsIndexData = path.join(__dirname, '../src/pages/docs/json/index.json');

describe('docs index.astro', () => {
    it('renders navigation from JSON data', () => {
        const content = fs.readFileSync(docsIndexFile, 'utf8');
        expect(content).toContain("import sections from './json/index.json'");
        expect(content).toMatch(/sections\.(map|forEach|reduce)/);

        expect(fs.existsSync(docsIndexData)).toBe(true);
        const sections = JSON.parse(fs.readFileSync(docsIndexData, 'utf8'));
        expect(Array.isArray(sections)).toBe(true);
        expect(sections.length).toBeGreaterThan(0);

        const seenHrefs = new Set();
        sections.forEach((section) => {
            expect(typeof section.title).toBe('string');
            expect(section.title.length).toBeGreaterThan(0);
            expect(Array.isArray(section.links)).toBe(true);
            expect(section.links.length).toBeGreaterThan(0);

            section.links.forEach((link) => {
                expect(typeof link.href).toBe('string');
                expect(link.href.length).toBeGreaterThan(0);
                expect(typeof link.label).toBe('string');
                expect(link.label.length).toBeGreaterThan(0);
                expect(seenHrefs.has(link.href)).toBe(false);
                seenHrefs.add(link.href);

                if (!link.external) {
                    expect(link.href.startsWith('/docs/')).toBe(true);
                    const slug = link.href.replace(/^\/docs\//, '');
                    const markdownPath = path.join(__dirname, '../src/pages/docs/md', `${slug}.md`);
                    expect(fs.existsSync(markdownPath)).toBe(true);
                }
            });
        });
    });
});
