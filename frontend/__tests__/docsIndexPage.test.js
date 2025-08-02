/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const docsIndexFile = path.join(__dirname, '../src/pages/docs/index.astro');

describe('docs index.astro', () => {
    it('links to the Codex prompts docs page', () => {
        const content = fs.readFileSync(docsIndexFile, 'utf8');
        expect(content).toMatch(/<a href="\/docs\/prompts-codex">Codex prompts<\/a>/);
    });
});
