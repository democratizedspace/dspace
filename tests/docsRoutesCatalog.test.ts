import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const routesDocPath = join(process.cwd(), 'docs', 'ROUTES.md');
const routesPagePath = join(
  process.cwd(),
  'frontend',
  'src',
  'pages',
  'docs',
  'md',
  'routes.md'
);

describe('routes catalog documentation', () => {
  it('lists required routes in the canonical docs index', () => {
    const content = readFileSync(routesDocPath, 'utf8');
    expect(content).toContain('/contentbackup');
    expect(content).toContain('/gamesaves');
    expect(content).toContain('/quests/manage');
    expect(content).toContain('/processes/manage');
  });

  it('publishes the route catalog on /docs/routes', () => {
    const content = readFileSync(routesPagePath, 'utf8');
    expect(content).toContain('/contentbackup');
    expect(content).toContain('/gamesaves');
    expect(content).toContain('/quests/manage');
    expect(content).toContain('/processes/manage');
  });
});
