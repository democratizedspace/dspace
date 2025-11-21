import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('merge plan documentation', () => {
  it('does not advertise unchecked release tasks', () => {
    const mergePlanPath = join(process.cwd(), 'docs', 'merge-plan.md');

    const content = readFileSync(mergePlanPath, 'utf8');

    expect(content).not.toMatch(/-\s+\[ \]/);
  });
});
