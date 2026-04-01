import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const roadmapPath = join(
  process.cwd(),
  'frontend',
  'src',
  'pages',
  'docs',
  'md',
  'roadmap.md'
);

describe('roadmap promises', () => {
  it('tracks base building as a planned v3 milestone', () => {
    const content = readFileSync(roadmapPath, 'utf8');

    expect(content).toMatch(/-\s+\[ \]\s+Top-down isometric base building/i);
    expect(content.toLowerCase()).toContain('late 2026');
  });
});
