import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const docPath = join(
  process.cwd(),
  'frontend',
  'src',
  'pages',
  'docs',
  'md',
  'user-journeys.md'
);

describe('user journeys documentation', () => {
  it('includes the coverage heading and table columns', () => {
    const content = readFileSync(docPath, 'utf8');
    expect(content).toMatch(/#\s+User Journeys/i);
    expect(content).toMatch(
      /\|\s*Journey\s*\|\s*Playwright coverage\s*\|\s*Test file\s*\|/i
    );
  });

  it('lists the e2e check for the doc itself', () => {
    const content = readFileSync(docPath, 'utf8');
    expect(content).toMatch(
      /\|\s*User journeys doc loads\s*\|\s*Yes\s*\|\s*`frontend\/e2e\/user-journeys-doc\.spec\.ts`\s*\|/i
    );
  });
});
