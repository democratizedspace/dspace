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

describe('docs RAG comparison', () => {
    it('falls back to dev-local when app SHA is missing', () => {
        const comparison = getDocsRagComparison('unknown', 'deadbeef');
        expect(comparison).toEqual({
            status: 'mismatch',
            message: '⚠️ mismatch (app: dev-local, docs: deadbeef)',
        });
        expect(getDocsRagMismatchWarning('unknown', 'deadbeef')).toBe(
            '⚠️ mismatch (app: dev-local, docs: deadbeef)'
        );
    });

    it('falls back to dev-local when app SHA is truly absent', () => {
        const comparison = getDocsRagComparison(undefined as unknown as string, 'deadbeef');
        expect(comparison).toEqual({
            status: 'mismatch',
            message: '⚠️ mismatch (app: dev-local, docs: deadbeef)',
        });
        expect(
            getDocsRagMismatchWarning(undefined as unknown as string, 'deadbeef')
        ).toBe('⚠️ mismatch (app: dev-local, docs: deadbeef)');
    });

    it('treats case-insensitive unknown app SHAs as dev-local', () => {
        const comparison = getDocsRagComparison('UNKNOWN', 'deadbeef');
        expect(comparison).toEqual({
            status: 'mismatch',
            message: '⚠️ mismatch (app: dev-local, docs: deadbeef)',
        });
        expect(getDocsRagMismatchWarning('UNKNOWN', 'deadbeef')).toBe(
            '⚠️ mismatch (app: dev-local, docs: deadbeef)'
        );
    });

    it('falls back to dev-local when docs SHA is missing', () => {
        const comparison = getDocsRagComparison('deadbeef', 'unknown');
        expect(comparison).toEqual({
            status: 'mismatch',
            message: '⚠️ mismatch (app: deadbeef, docs: dev-local)',
        });
        expect(getDocsRagMismatchWarning('deadbeef', 'unknown')).toBe(
            '⚠️ mismatch (app: deadbeef, docs: dev-local)'
        );
    });

    it('treats case-insensitive unknown docs SHAs as dev-local', () => {
        const comparison = getDocsRagComparison('deadbeef', 'UNKNOWN');
        expect(comparison).toEqual({
            status: 'mismatch',
            message: '⚠️ mismatch (app: deadbeef, docs: dev-local)',
        });
        expect(getDocsRagMismatchWarning('deadbeef', 'UNKNOWN')).toBe(
            '⚠️ mismatch (app: deadbeef, docs: dev-local)'
        );
    });

    it('reports match when SHAs align', () => {
        const comparison = getDocsRagComparison('abc123', 'abc123');
        expect(comparison).toEqual({
            status: 'match',
            message: '✅ in sync',
        });
        expect(getDocsRagMismatchWarning('abc123', 'abc123')).toBeNull();
    });

    it('reports mismatch when SHAs differ', () => {
        const comparison = getDocsRagComparison('aaaaaaaa', 'bbbbbbbb');
        expect(comparison).toEqual({
            status: 'mismatch',
            message: '⚠️ mismatch (app: aaaaaaaa, docs: bbbbbbbb)',
        });
        expect(getDocsRagMismatchWarning('aaaaaaaa', 'bbbbbbbb')).toBe(
            '⚠️ mismatch (app: aaaaaaaa, docs: bbbbbbbb)'
        );
    });

    it('matches by prefix when SHAs share a prefix', () => {
        const comparison = getDocsRagComparison('abc123', 'abc123def456');
        expect(comparison).toEqual({
            status: 'match',
            message: '✅ in sync',
        });
    });
});
