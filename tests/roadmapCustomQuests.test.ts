import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('roadmap custom quests entry', () => {
  const roadmapPath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'roadmap.md'
  );

  it('reflects that the custom quest system has shipped', () => {
    const content = readFileSync(roadmapPath, 'utf8');

    expect(content).not.toMatch(/-\s+\[ \]\s+\[?custom quests/i);
    expect(content).toContain('-   [x] [custom quests](/docs/custom-quest-system)');
  });
});
