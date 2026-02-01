import { describe, expect, it } from 'vitest';
import { resolveDocsRagMeta } from '../src/utils/docsRagMeta.js';

describe('resolveDocsRagMeta', () => {
    it('returns a warning when app and docs SHAs differ', () => {
        const result = resolveDocsRagMeta({
            meta: { gitSha: 'docs-sha', generatedAt: '2024-01-01T00:00:00.000Z' },
            buildSha: 'app-sha',
        });

        expect(result.warning).toBe('Docs RAG is stale vs app build.');
        expect(result.hasMismatch).toBe(true);
    });
});
