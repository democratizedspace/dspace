import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const importerPath = path.join(__dirname, '../src/pages/contentbackup/svelte/Importer.svelte');

describe('Custom content importer accessibility', () => {
    it('keeps the import textarea wired to a visible label', () => {
        const source = fs.readFileSync(importerPath, 'utf8');

        expect(source).toContain("const IMPORT_LABEL = 'Paste your custom content backup here';");
        expect(source).toContain('<label class="input-label" for={IMPORT_TEXTAREA_ID}');
        expect(source).toContain('{IMPORT_LABEL}<span aria-hidden="true">:</span>');
        expect(source).toContain('<textarea');
        expect(source).toContain('id={IMPORT_TEXTAREA_ID}');
        expect(source).toContain('aria-label={IMPORT_LABEL}');
    });
});
