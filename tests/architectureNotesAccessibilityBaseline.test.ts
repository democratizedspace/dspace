import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

describe('architecture notes accessibility baseline', () => {
    it('graduates the accessibility baseline from the current iteration focus', () => {
        const docPath = path.join(
            path.dirname(fileURLToPath(import.meta.url)),
            '..',
            'docs',
            'contrib',
            'architecture-notes.md',
        );
        const content = fs.readFileSync(docPath, 'utf8');
        const focusMatch = content.match(/### Current Iteration Focus[\s\S]*?## Sequencing Strategy/);
        expect(focusMatch).not.toBeNull();
        expect(focusMatch?.[0]).not.toMatch(/Accessibility baseline/i);
    });
});
