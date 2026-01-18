import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
    'frontend/src/pages/contentbackup/svelte/Importer.svelte',
    'utf8'
);

describe('Custom content backup importer accessibility', () => {
    it('includes a persistent accessible label for the import dropzone', () => {
        expect(source).toMatch(
            /const\s+dropzoneLabelId\s*=\s*'custom-content-backup-dropzone-label'/
        );
        expect(source).toMatch(
            /<p\s+id={dropzoneLabelId}>\s*Drag and drop your backup file here, or click to browse\./
        );
        expect(source).toMatch(/aria-labelledby={dropzoneLabelId}/);
        expect(source).toMatch(/type="file"/);
    });
});
