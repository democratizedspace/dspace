import { describe, expect, it } from 'vitest';
import docsMeta from '../frontend/src/generated/rag/docs_meta.json';
import { getDocsRagComparison, getDocsRagMismatchWarning } from '../frontend/src/utils/docsRag.js';

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

describe('docs RAG mismatch warning', () => {
    it('warns when app and docs SHAs differ', () => {
        const warning = getDocsRagMismatchWarning('aaaaaaaa', 'bbbbbbbb');
        expect(warning).toBe('Docs RAG is stale vs app build.');
    });

    it('does not warn when app SHA is unknown', () => {
        const warning = getDocsRagMismatchWarning('unknown', 'deadbeef');
        expect(warning).toBeNull();
    });

    it('does not warn when docs SHA is unknown', () => {
        const warning = getDocsRagMismatchWarning('deadbeef', 'unknown');
        expect(warning).toBeNull();
    });

    it('returns null when SHAs match', () => {
        const warning = getDocsRagMismatchWarning('abc123', 'abc123');
        expect(warning).toBeNull();
    });

    it('does not warn when either SHA is empty', () => {
        const warning = getDocsRagMismatchWarning('', 'abc123');
        expect(warning).toBeNull();
    });

    it('returns null when SHAs match by prefix', () => {
        const warning = getDocsRagMismatchWarning('abc123', 'abc123def456');
        expect(warning).toBeNull();
    });
});

describe('docs RAG comparison message', () => {
    it('returns cannot compare when app SHA is missing', () => {
        const comparison = getDocsRagComparison('unknown', 'deadbeef');
        expect(comparison).toEqual({
            status: 'unavailable',
            message: 'App build SHA unavailable; cannot compare.',
        });
    });

    it('returns match when SHAs align', () => {
        const comparison = getDocsRagComparison('abc123', 'abc123');
        expect(comparison).toEqual({
            status: 'match',
            message: 'Docs RAG matches app build.',
        });
    });

    it('returns stale when SHAs differ', () => {
        const comparison = getDocsRagComparison('abc123', 'def456');
        expect(comparison).toEqual({
            status: 'stale',
            message: 'Docs RAG is stale vs app build.',
        });
    });
});
