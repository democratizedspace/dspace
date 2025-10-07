import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.join(__dirname, '..');
const docPath = path.join(
  repoRoot,
  'frontend',
  'src',
  'pages',
  'docs',
  'md',
  'user-journeys.md'
);

describe('User journeys documentation', () => {
  it('marks the quest PR form journey as covered by an e2e spec', () => {
    const markdown = readFileSync(docPath, 'utf8');
    const row = markdown
      .split('\n')
      .find((line) => line.trim().startsWith('| Quest PR form'));

    expect(row).toBeDefined();

    const cells = row
      ?.split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());

    expect(cells).toBeDefined();
    expect(cells?.length).toBeGreaterThanOrEqual(3);

    const coverageCell = cells?.[1] ?? '';
    expect(coverageCell).toBe('Yes');

    const testFileCell = cells?.[2] ?? '';
    expect(testFileCell).not.toBe('--');

    const referencedPath = testFileCell.replace(/`/g, '').trim();
    expect(referencedPath).toBe('frontend/e2e/quest-pr-form.spec.ts');

    const absolutePath = path.join(repoRoot, referencedPath);
    expect(existsSync(absolutePath)).toBe(true);
  });
});
