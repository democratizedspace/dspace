import { describe, expect, it } from 'vitest';
import docsMeta from '../frontend/src/generated/rag/docs_meta.json';

describe('docs RAG metadata', () => {
    it('includes a non-unknown git SHA', () => {
        expect(docsMeta.gitSha).toBeDefined();
        expect(docsMeta.gitSha).not.toBe('unknown');
    });

    it('includes a valid generatedAt timestamp', () => {
        const parsed = new Date(docsMeta.generatedAt);
        expect(Number.isNaN(parsed.getTime())).toBe(false);
    });
});
