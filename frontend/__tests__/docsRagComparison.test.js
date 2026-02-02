const { getDocsRagComparison } = require('../src/utils/docsRag.js');

describe('getDocsRagComparison', () => {
    test('returns unavailable when app build SHA is unknown', () => {
        expect(getDocsRagComparison('unknown', 'abc123')).toEqual({
            status: 'unavailable',
            message: 'App build SHA unavailable; cannot compare.',
        });
    });

    test('returns match when SHAs are identical', () => {
        expect(getDocsRagComparison('abc123', 'abc123')).toEqual({
            status: 'match',
            message: 'Docs RAG matches app build.',
        });
    });

    test('returns stale when SHAs differ', () => {
        expect(getDocsRagComparison('abc123', 'def456')).toEqual({
            status: 'stale',
            message: 'Docs RAG is stale vs app build.',
        });
    });
});
