import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
    'frontend/src/pages/contentbackup/svelte/Importer.svelte',
    'utf8'
);

describe('Custom content backup importer accessibility', () => {
    it('includes a labeled file upload control for the import dropzone', () => {
        expect(source).toMatch(/const\s+inputId\s*=\s*'custom-content-backup-file'/);
        expect(source).toMatch(/<label[\s\S]*for={inputId}/);
        expect(source).toMatch(/<input[\s\S]*id={inputId}[\s\S]*type=\"file\"/);
        expect(source).toMatch(/Drag and drop your backup file here/);
    });
});
