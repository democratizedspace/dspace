import { describe, expect, it } from 'vitest';
import docsMeta from '../frontend/src/generated/rag/docs_meta.json';
import { getDocsRagMismatchWarning } from '../frontend/src/utils/docsRag.js';

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

    it('returns null when SHAs match', () => {
        const warning = getDocsRagMismatchWarning('abc123', 'abc123');
        expect(warning).toBeNull();
    });

    it('returns null when either SHA is unknown', () => {
        const warning = getDocsRagMismatchWarning('unknown', 'abc123');
        expect(warning).toBeNull();
    });

    it('returns null when either SHA is empty', () => {
        const warning = getDocsRagMismatchWarning('', 'abc123');
        expect(warning).toBeNull();
    });

    it('returns null when SHAs match by prefix', () => {
        const warning = getDocsRagMismatchWarning('abc123', 'abc123def456');
        expect(warning).toBeNull();
    });
});
