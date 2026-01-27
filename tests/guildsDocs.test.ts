import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Guilds documentation', () => {
    const docsDir = join(process.cwd(), 'frontend', 'src', 'pages', 'docs', 'md');

    it('describes guilds as a planned feature', () => {
        const guildsDoc = readFileSync(join(docsDir, 'guilds.md'), 'utf8');

        expect(guildsDoc).toMatch(/planned for DSPACE v3/i);
        expect(guildsDoc).toMatch(/Metaguild/);
    });

    it('marks guilds as upcoming on the roadmap', () => {
        const roadmapDoc = readFileSync(join(docsDir, 'roadmap.md'), 'utf8');

        expect(roadmapDoc).toMatch(/\[ \] guilds/i);
        expect(roadmapDoc).not.toMatch(/\[\s*x] guilds/i);
    });
});
