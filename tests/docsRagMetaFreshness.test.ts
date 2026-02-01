import { describe, expect, it } from 'vitest';
import docsMeta from '../frontend/src/generated/rag/docs_meta.json';

describe('docs RAG metadata freshness', () => {
    it('includes a concrete git SHA', () => {
        expect(docsMeta.gitSha).toBeTruthy();
        expect(docsMeta.gitSha).not.toBe('unknown');
    });

    it('includes a valid generatedAt timestamp', () => {
        expect(Number.isNaN(Date.parse(docsMeta.generatedAt))).toBe(false);
    });
});
