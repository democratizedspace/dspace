import { describe, expect, it } from 'vitest';
import docsMeta from '../frontend/src/generated/rag/docs_meta.json';
import { getDocsRagComparisonStatus } from '../frontend/src/utils/docsRag.js';

describe('docs RAG metadata freshness', () => {
    it('records a concrete git SHA', () => {
        expect(docsMeta.gitSha).toBeTruthy();
        expect(String(docsMeta.gitSha)).not.toBe('unknown');
    });

    it('records a valid generatedAt timestamp', () => {
        const timestamp = String(docsMeta.generatedAt ?? '');
        expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
        expect(Number.isNaN(Date.parse(timestamp))).toBe(false);
    });
});

describe('docs RAG comparison status', () => {
    it('reports a mismatch when app and docs SHAs differ', () => {
        const status = getDocsRagComparisonStatus('aaaaaaaa', 'bbbbbbbb');
        expect(status).toBe('Docs RAG is stale vs app build.');
    });

    it('returns cannot compare when app SHA is unknown', () => {
        const status = getDocsRagComparisonStatus('unknown', 'deadbeef');
        expect(status).toBe('App build SHA unavailable; cannot compare.');
    });

    it('returns cannot compare when docs SHA is unknown', () => {
        const status = getDocsRagComparisonStatus('deadbeef', 'unknown');
        expect(status).toBe('Docs RAG SHA unavailable; cannot compare.');
    });

    it('reports a match when SHAs match', () => {
        const status = getDocsRagComparisonStatus('abc123', 'abc123');
        expect(status).toBe('Docs RAG matches app build.');
    });

    it('returns cannot compare when app SHA is empty', () => {
        const status = getDocsRagComparisonStatus('', 'abc123');
        expect(status).toBe('App build SHA unavailable; cannot compare.');
    });

    it('reports a match when SHAs match by prefix', () => {
        const status = getDocsRagComparisonStatus('abc123', 'abc123def456');
        expect(status).toBe('Docs RAG matches app build.');
    });
});
