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
    it('reports unavailable when app SHA is missing', () => {
        const comparison = getDocsRagComparison('unknown', 'deadbeef', { envName: 'dev' });
        expect(comparison).toEqual({
            status: 'assumed',
            message: 'ℹ️ dev fallback; app SHA missing (docs: deadbeef)',
        });
        expect(getDocsRagMismatchWarning('unknown', 'deadbeef', { envName: 'dev' })).toBeNull();
    });

    it('reports unavailable when app SHA is truly absent', () => {
        const comparison = getDocsRagComparison(undefined as unknown as string, 'deadbeef', {
            envName: 'dev',
        });
        expect(comparison).toEqual({
            status: 'assumed',
            message: 'ℹ️ dev fallback; app SHA missing (docs: deadbeef)',
        });
        expect(
            getDocsRagMismatchWarning(undefined as unknown as string, 'deadbeef', {
                envName: 'dev',
            })
        ).toBeNull();
    });

    it('treats case-insensitive unknown app SHAs as unavailable', () => {
        const comparison = getDocsRagComparison('UNKNOWN', 'deadbeef', { envName: 'dev' });
        expect(comparison).toEqual({
            status: 'assumed',
            message: 'ℹ️ dev fallback; app SHA missing (docs: deadbeef)',
        });
        expect(getDocsRagMismatchWarning('UNKNOWN', 'deadbeef', { envName: 'dev' })).toBeNull();
    });

    it('reports unavailable when app SHA is a local placeholder', () => {
        const comparison = getDocsRagComparison('dev-local', 'deadbeef', { envName: 'dev' });
        expect(comparison).toEqual({
            status: 'assumed',
            message: 'ℹ️ dev fallback; app SHA missing (docs: deadbeef)',
        });
        expect(getDocsRagMismatchWarning('dev-local', 'deadbeef', { envName: 'dev' })).toBeNull();
    });

    it('reports unavailable when app SHA is a missing placeholder', () => {
        const comparison = getDocsRagComparison('missing-sha', 'deadbeef', { envName: 'dev' });
        expect(comparison).toEqual({
            status: 'assumed',
            message: 'ℹ️ dev fallback; app SHA missing (docs: deadbeef)',
        });
        expect(getDocsRagMismatchWarning('missing-sha', 'deadbeef', { envName: 'dev' })).toBeNull();
    });

    it('reports unavailable when docs SHA is missing', () => {
        const comparison = getDocsRagComparison('deadbeef', 'unknown', { envName: 'dev' });
        expect(comparison).toEqual({
            status: 'unavailable',
            message: 'ℹ️ docs SHA unavailable (app: deadbeef, docs: unavailable)',
        });
        expect(getDocsRagMismatchWarning('deadbeef', 'unknown', { envName: 'dev' })).toBeNull();
    });

    it('treats case-insensitive unknown docs SHAs as unavailable', () => {
        const comparison = getDocsRagComparison('deadbeef', 'UNKNOWN', { envName: 'dev' });
        expect(comparison).toEqual({
            status: 'unavailable',
            message: 'ℹ️ docs SHA unavailable (app: deadbeef, docs: unavailable)',
        });
        expect(getDocsRagMismatchWarning('deadbeef', 'UNKNOWN', { envName: 'dev' })).toBeNull();
    });

    it('reports match when SHAs align', () => {
        const comparison = getDocsRagComparison('abc123', 'abc123', { envName: 'dev' });
        expect(comparison).toEqual({
            status: 'match',
            message: '✅ in sync (app: abc123, docs: abc123)',
        });
        expect(getDocsRagMismatchWarning('abc123', 'abc123', { envName: 'dev' })).toBeNull();
    });

    it('reports stale when SHAs differ', () => {
        const comparison = getDocsRagComparison('aaaaaaaa', 'bbbbbbbb', { envName: 'dev' });
        expect(comparison).toEqual({
            status: 'mismatch',
            message: '⚠️ mismatch (app: aaaaaaaa, docs: bbbbbbbb)',
        });
        expect(getDocsRagMismatchWarning('aaaaaaaa', 'bbbbbbbb', { envName: 'dev' })).toBe(
            '⚠️ mismatch (app: aaaaaaaa, docs: bbbbbbbb)'
        );
    });

    it('matches by prefix when SHAs share a prefix', () => {
        const comparison = getDocsRagComparison('abc123', 'abc123def456', { envName: 'dev' });
        expect(comparison).toEqual({
            status: 'match',
            message: '✅ in sync (app: abc123, docs: abc123def456)',
        });
    });
});
