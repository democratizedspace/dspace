import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    getDocsRagMismatchWarning,
    getDocsRagMismatchWarningText,
} from '../frontend/src/utils/docsRagMeta.js';

describe('docs RAG metadata freshness', () => {
    it('includes a non-unknown git SHA and a valid generatedAt timestamp', () => {
        const metaPath = join(
            process.cwd(),
            'frontend',
            'src',
            'generated',
            'rag',
            'docs_meta.json'
        );
        const raw = readFileSync(metaPath, 'utf-8');
        const meta = JSON.parse(raw);

        expect(typeof meta.gitSha).toBe('string');
        expect(meta.gitSha).not.toBe('unknown');
        expect(meta.gitSha.trim().length).toBeGreaterThan(0);

        const parsed = Date.parse(meta.generatedAt);
        expect(Number.isNaN(parsed)).toBe(false);
    });
});

describe('docs RAG mismatch warning', () => {
    it('returns the warning text when build and docs SHAs differ', () => {
        const warning = getDocsRagMismatchWarning('app-sha', 'docs-sha');
        expect(warning).toBe(getDocsRagMismatchWarningText());
    });
});
