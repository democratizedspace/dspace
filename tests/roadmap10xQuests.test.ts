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

  it('marks the 10x More Quests milestone as shipped', () => {
    const content = readFileSync(roadmapPath, 'utf8');

    // Verify it's not marked as incomplete
    expect(content).not.toMatch(/-\s+\[ \]\s+10x.*quests/i);
    
    // Verify it's marked as complete
    expect(content).toMatch(/-\s+\[x\]\s+10x.*quests/i);
  });
});
