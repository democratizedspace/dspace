import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const roadmapPath = path.join(
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
    const roadmapContent = fs.readFileSync(roadmapPath, 'utf8');

    expect(roadmapContent).not.toMatch(/^- \[ \] top-down isometric base building/m);
    expect(roadmapContent.toLowerCase()).toContain('top-down isometric base building');
    expect(roadmapContent.toLowerCase()).toContain('deferred');
  });
});
