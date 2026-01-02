/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const docsIndexFile = path.join(__dirname, '../src/pages/docs/index.astro');
const docsSectionsFile = path.join(__dirname, '../src/pages/docs/json/sections.json');

describe('docs index.astro', () => {
    it('renders docs navigation from JSON sections', () => {
        expect(fs.existsSync(docsSectionsFile)).toBe(true);

        const sections = JSON.parse(fs.readFileSync(docsSectionsFile, 'utf8'));
        const content = fs.readFileSync(docsIndexFile, 'utf8');

        // Using import assertions for JSON imports
        expect(content).toMatch(
            /import sections from '\.\/json\/sections\.json' assert { type: 'json' }/
        );
        expect(content).toMatch(/sections\.map/);

        const allLinks = sections.flatMap((section) => section.links);
        const codexPromptLink = allLinks.find((link) => link.href === '/docs/prompts-codex');
        expect(codexPromptLink?.label).toBe('Codex prompt library');

        const implementPromptLink = allLinks.find((link) =>
            link.href.includes('docs/prompts/codex/implement.md')
        );
        expect(implementPromptLink).toBeUndefined();
    });
});
