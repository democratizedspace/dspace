import { describe, expect, it } from 'vitest';
import { getDocsRagStalenessWarning } from '../frontend/src/utils/docsRagMeta.js';

describe('docs RAG staleness warning', () => {
    it('returns a warning when SHAs differ', () => {
        const warning = getDocsRagStalenessWarning('app-sha', 'docs-sha');
        expect(warning).toBe('Docs RAG is stale vs app build.');
    });

    it('returns null when SHAs match', () => {
        const warning = getDocsRagStalenessWarning('same-sha', 'same-sha');
        expect(warning).toBeNull();
    });
});
