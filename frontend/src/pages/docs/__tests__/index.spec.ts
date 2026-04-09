import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const docsIndexFile = path.join(process.cwd(), 'frontend/src/pages/docs/index.astro');

describe('/docs index page payload shape', () => {
    it('keeps initial sections payload lightweight and points to deferred corpus', () => {
        const content = fs.readFileSync(docsIndexFile, 'utf8');

        expect(content).toContain('return { ...link, slug, features };');
        expect(content).toContain('deferredCorpusHref="/docs/full-text-corpus.json"');
        expect(content).not.toContain('bodyText');
    });
});
