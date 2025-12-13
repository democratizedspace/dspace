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
  it('tracks base building as deferred without promising a checkbox', () => {
    const content = readFileSync(roadmapPath, 'utf8');

    expect(content).not.toMatch(/^- \[ \] top-down isometric base building/m);
    expect(content.toLowerCase()).toContain('top-down isometric base building');
    expect(content.toLowerCase()).toContain('deferred');
  });
});
