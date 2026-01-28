import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('roadmap 10x More Quests entry', () => {
  const roadmapPath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'roadmap.md'
  );

  it('marks the 10x More Quests milestone as upcoming', () => {
    const content = readFileSync(roadmapPath, 'utf8');

    // Verify it's not marked as complete
    expect(content).not.toMatch(/-\s+\[x\]\s+10x.*quests/i);

    // Verify it's marked as planned
    expect(content).toMatch(/-\s+\[ \]\s+10x.*quests/i);
  });
});
