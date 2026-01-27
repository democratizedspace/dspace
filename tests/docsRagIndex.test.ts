import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const loadJson = (relativePath: string) => {
    const fullPath = path.join(process.cwd(), relativePath);
    return JSON.parse(readFileSync(fullPath, 'utf8'));
};

describe('docs RAG artifacts', () => {
    const chunks = loadJson('frontend/src/generated/rag/docs_chunks.json');

    it('includes doc, route, and changelog chunks', () => {
        const kinds = new Set(chunks.map((chunk: { kind: string }) => chunk.kind));

        expect(kinds.has('doc')).toBe(true);
        expect(kinds.has('route')).toBe(true);
        expect(kinds.has('changelog')).toBe(true);

        const hasRoutesDoc = chunks.some(
            (chunk: { kind: string; path: string }) =>
                chunk.kind === 'route' && chunk.path.endsWith('docs/ROUTES.md')
        );
        expect(hasRoutesDoc).toBe(true);
    });

    it('has non-empty chunks with stable slugs and anchors', () => {
        expect(chunks.length).toBeGreaterThan(0);

        const anchorPattern = /^[a-z0-9][a-z0-9-_]*$/;

        chunks.forEach(
            (chunk: { slug: string; anchor: string; text: string; id: string }) => {
                expect(chunk.id).toBeTruthy();
                expect(chunk.text?.trim().length).toBeGreaterThan(0);
                expect(chunk.slug?.trim().length).toBeGreaterThan(0);
                expect(chunk.anchor).toMatch(anchorPattern);
            }
        );
    });
});
