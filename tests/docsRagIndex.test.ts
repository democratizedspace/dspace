import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

type Chunk = {
    id: string;
    path: string;
    slug: string;
    title: string;
    heading: string;
    anchor: string;
    text: string;
    kind: 'doc' | 'route' | 'changelog';
};

const CHUNKS_PATH = path.join(
    process.cwd(),
    'frontend',
    'src',
    'generated',
    'rag',
    'docs_chunks.json'
);

const chunks = JSON.parse(readFileSync(CHUNKS_PATH, 'utf8')) as Chunk[];
const anchorPattern = /^[a-z0-9_-]+$/;

const hasChunkFromPath = (suffix: string) =>
    chunks.some((chunk) => chunk.path.replace(/\\/g, '/').endsWith(suffix));

describe('docs RAG index artifacts', () => {
    it('includes docs, routes, and changelog sources', () => {
        expect(chunks.length).toBeGreaterThan(0);

        expect(chunks.some((chunk) => chunk.kind === 'doc')).toBe(true);
        expect(chunks.some((chunk) => chunk.kind === 'route')).toBe(true);
        expect(chunks.some((chunk) => chunk.kind === 'changelog')).toBe(true);

        expect(hasChunkFromPath('docs/ROUTES.md')).toBe(true);

        const changelogV3Path = path.join(
            process.cwd(),
            'frontend',
            'src',
            'pages',
            'docs',
            'md',
            'changelog',
            '20260301.md'
        );

        if (existsSync(changelogV3Path)) {
            expect(hasChunkFromPath('frontend/src/pages/docs/md/changelog/20260301.md')).toBe(true);
        }
    });

    it('ensures chunks include stable slugs, anchors, and text', () => {
        chunks.forEach((chunk) => {
            expect(chunk.slug).toBeTruthy();
            expect(chunk.anchor).toBeTruthy();
            expect(chunk.anchor).toMatch(anchorPattern);
            expect(chunk.text.trim().length).toBeGreaterThan(0);
        });
    });
});
