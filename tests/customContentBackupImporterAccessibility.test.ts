import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
    'frontend/src/pages/contentbackup/svelte/Importer.svelte',
    'utf8'
);

describe('Custom content backup importer accessibility', () => {
    it('includes a persistent accessible label for the import textarea', () => {
        expect(source).toMatch(/const\s+importTextareaLabelId\s*=\s*'custom-content-backup-label'/);
        expect(source).toMatch(/<p\s+id={importTextareaLabelId}>Paste your custom content backup here:/);
        expect(source).toMatch(/<textarea[\s\S]*aria-labelledby={importTextareaLabelId}/);
    });
});
