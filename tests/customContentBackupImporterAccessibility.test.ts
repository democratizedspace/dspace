import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
    'frontend/src/pages/contentbackup/svelte/Importer.svelte',
    'utf8'
);

describe('Custom content backup importer accessibility', () => {
    it('includes a persistent accessible label for the import file input', () => {
        expect(source).toMatch(/const\s+fileInputLabelId\s*=\s*'custom-content-backup-label'/);
        expect(source).toMatch(/id={fileInputLabelId}/);
        expect(source).toMatch(/aria-labelledby={fileInputLabelId}/);
    });
});
