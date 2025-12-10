import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const roadmapPath = join(repoRoot, 'frontend/src/pages/docs/md/roadmap.md');

it('keeps the roadmap free of unchecked promises', () => {
    const roadmap = readFileSync(roadmapPath, 'utf8');
    const unchecked = Array.from(roadmap.matchAll(/^\s*- \[ \] .+$/gm)).map((match) => match[0]);

    expect(
        unchecked,
        unchecked.length
            ? `Roadmap has unchecked items: ${unchecked.join('; ')}`
            : 'Roadmap should not advertise unchecked promises'
    ).toHaveLength(0);
});
