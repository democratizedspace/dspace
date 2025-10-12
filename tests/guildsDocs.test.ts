import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Guilds documentation', () => {
    const docsDir = join(process.cwd(), 'frontend', 'src', 'pages', 'docs', 'md');

    it('describes guilds as a shipped feature', () => {
        const guildsDoc = readFileSync(join(docsDir, 'guilds.md'), 'utf8');

        expect(guildsDoc).not.toMatch(/In the future/i);
        expect(guildsDoc).toMatch(/Metaguild/);
    });

    it('marks guilds as complete on the roadmap', () => {
        const roadmapDoc = readFileSync(join(docsDir, 'roadmap.md'), 'utf8');

        expect(roadmapDoc).not.toMatch(/\[ \] guilds/i);
        expect(roadmapDoc).toMatch(/\[\s*x] guilds/i);
    });
});
