import { describe, it, expect } from 'vitest';
import { searchDocsRag } from '../frontend/src/utils/docsRag.js';

describe('docs RAG routes catalog', () => {
  it('returns the routes catalog for custom content backup questions', async () => {
    const result = await searchDocsRag(
      'What is the canonical route for custom content backup?'
    );

    const hasRoutesSource = result.sources.some((source) =>
      source.url?.startsWith('/docs/routes')
    );

    expect(hasRoutesSource).toBe(true);
    expect(result.excerptsText).toContain('/contentbackup');
  });
});
