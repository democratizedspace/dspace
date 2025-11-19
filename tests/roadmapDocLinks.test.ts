import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Roadmap documentation', () => {
    it('links the DSPACE v2 milestone to its release notes', () => {
        const docPath = join(
            process.cwd(),
            'frontend',
            'src',
            'pages',
            'docs',
            'md',
            'roadmap.md'
        );

        const content = readFileSync(docPath, 'utf8');
        const v2Line = content.split('\n').find((line) => line.includes('[DSPACE v2]'));

        expect(v2Line, 'Roadmap should mention the DSPACE v2 milestone').toBeDefined();
        expect(v2Line).toMatch(/\[DSPACE v2\]\([^\s)]+\)/);
        expect(v2Line).toContain('/docs/changelog/20230630');
        expect(v2Line).not.toMatch(/\[DSPACE v2\]\(\)/);
    });
});
