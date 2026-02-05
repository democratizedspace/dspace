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
        const comparison = getDocsRagComparison('unknown', 'deadbeef');
        expect(comparison).toEqual({
            status: 'unverified',
            message: '⚠️ cannot verify app/docs sync (app SHA missing)',
        });
        expect(getDocsRagMismatchWarning('unknown', 'deadbeef')).toBeNull();
    });

    it('reports unavailable when app SHA is truly absent', () => {
        const comparison = getDocsRagComparison(undefined as unknown as string, 'deadbeef');
        expect(comparison).toEqual({
            status: 'unverified',
            message: '⚠️ cannot verify app/docs sync (app SHA missing)',
        });
        expect(getDocsRagMismatchWarning(undefined as unknown as string, 'deadbeef')).toBeNull();
    });

    it('treats case-insensitive unknown app SHAs as unavailable', () => {
        const comparison = getDocsRagComparison('UNKNOWN', 'deadbeef');
        expect(comparison).toEqual({
            status: 'unverified',
            message: '⚠️ cannot verify app/docs sync (app SHA missing)',
        });
        expect(getDocsRagMismatchWarning('UNKNOWN', 'deadbeef')).toBeNull();
    });

    it('reports unavailable when app SHA is a local placeholder', () => {
        const comparison = getDocsRagComparison('dev-local', 'deadbeef');
        expect(comparison).toEqual({
            status: 'unverified',
            message: '⚠️ cannot verify app/docs sync (app SHA missing)',
        });
        expect(getDocsRagMismatchWarning('dev-local', 'deadbeef')).toBeNull();
    });

    it('reports unavailable when app SHA is a missing placeholder', () => {
        const comparison = getDocsRagComparison('missing-sha', 'deadbeef');
        expect(comparison).toEqual({
            status: 'unverified',
            message: '⚠️ cannot verify app/docs sync (app SHA missing)',
        });
        expect(getDocsRagMismatchWarning('missing-sha', 'deadbeef')).toBeNull();
    });

    it('reports unavailable when docs SHA is missing', () => {
        const comparison = getDocsRagComparison('deadbeef', 'unknown');
        expect(comparison).toEqual({
            status: 'unverified',
            message: '⚠️ cannot verify app/docs sync (docs SHA missing)',
        });
        expect(getDocsRagMismatchWarning('deadbeef', 'unknown')).toBeNull();
    });

    it('treats case-insensitive unknown docs SHAs as unavailable', () => {
        const comparison = getDocsRagComparison('deadbeef', 'UNKNOWN');
        expect(comparison).toEqual({
            status: 'unverified',
            message: '⚠️ cannot verify app/docs sync (docs SHA missing)',
        });
        expect(getDocsRagMismatchWarning('deadbeef', 'UNKNOWN')).toBeNull();
    });

    it('reports match when SHAs align', () => {
        const comparison = getDocsRagComparison('abc123', 'abc123');
        expect(comparison).toEqual({
            status: 'match',
            message: '✅ in sync',
        });
        expect(getDocsRagMismatchWarning('abc123', 'abc123')).toBeNull();
    });

    it('reports stale when SHAs differ', () => {
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
