import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('roadmap guided model rocket entry', () => {
  const roadmapPath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'roadmap.md'
  );

  it('marks the in-game guided model rocket upgrade as shipped', () => {
    const content = readFileSync(roadmapPath, 'utf8');

    expect(content).not.toMatch(/-\s+\[ \]\s+in-game guided model rocket upgrade/i);
    expect(content).toMatch(/-\s+\[x\]\s+in-game guided model rocket upgrade/i);
  });
});
