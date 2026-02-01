import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('routes catalog docs', () => {
  const routesPath = join(process.cwd(), 'docs', 'ROUTES.md');

  it('includes key canonical routes', () => {
    const content = readFileSync(routesPath, 'utf8');

    expect(content).toContain('/contentbackup');
    expect(content).toContain('/gamesaves');
    expect(content).toContain('/quests/manage');
    expect(content).toContain('/processes/manage');
  });
});
