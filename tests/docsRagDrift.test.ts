import { describe, expect, it } from 'vitest';

import { searchDocsRag } from '../frontend/src/utils/docsRag.js';

describe('docs RAG drift intent', () => {
    it('forces the v3 release state doc for v2-only drift queries', async () => {
        const { sources } = await searchDocsRag('what v2-only mechanics were removed in v3');
        const includesV3ReleaseState = sources.some((source) =>
            source.url?.startsWith('/docs/v3-release-state')
        );
        expect(includesV3ReleaseState).toBe(true);
    });
});
