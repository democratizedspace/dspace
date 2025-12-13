import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('roadmap checklist', () => {
  const roadmapPath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'roadmap.md'
  );

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
});
