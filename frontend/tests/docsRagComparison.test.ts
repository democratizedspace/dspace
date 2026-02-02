import { describe, expect, it } from 'vitest';
import { getDocsRagComparison } from '../src/utils/docsRag.js';

describe('getDocsRagComparison', () => {
    it('reports app build SHA unavailable when app SHA is missing', () => {
        const comparison = getDocsRagComparison(undefined, 'abc123');

        expect(comparison.status).toBe('unavailable');
        expect(comparison.message).toBe('App build SHA unavailable; cannot compare.');
    });

    it('reports match when docs RAG SHA matches app build SHA', () => {
        const comparison = getDocsRagComparison('abc123', 'abc123');

        expect(comparison.status).toBe('match');
        expect(comparison.message).toBe('Docs RAG matches app build.');
    });

    it('reports stale when docs RAG SHA differs from app build SHA', () => {
        const comparison = getDocsRagComparison('abc123', 'def456');

        expect(comparison.status).toBe('stale');
        expect(comparison.message).toBe('Docs RAG is stale vs app build.');
    });
});
