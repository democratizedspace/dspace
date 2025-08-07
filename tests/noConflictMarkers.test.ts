import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import glob from 'glob';

/**
 * Fails if any file in the repository still contains unresolved merge-conflict markers.
 * CI already catches formatting issues, but conflict markers can sneak through when hooks are bypassed.
 */

describe('repository sanity ‑ no merge-conflict markers', () => {
  const REPO_ROOT = join(__dirname, '..');

  // Exclude heavy or generated dirs
  const ignore = [
    '**/node_modules/**',
    '**/.git/**',
    '**/coverage/**',
    '**/dist/**',
    '**/.turbo/**',
  ];

  const patterns = ['**/*'];
  const files = patterns.flatMap((pattern) =>
    glob.sync(pattern, {
      cwd: REPO_ROOT,
      nodir: true,
      ignore,
    }),
  );

  it('contains no <<<<<<< or >>>>>>> markers', () => {
    const offenders: string[] = [];

    files.forEach((relativePath) => {
      const fullPath = join(REPO_ROOT, relativePath);
      const content = readFileSync(fullPath, 'utf8');
      if (/<<<<<<< |>>>>>>> |======= /.test(content)) {
        offenders.push(relativePath);
      }
    });

    expect(offenders, `Conflict markers found in:\n${offenders.join('\n')}`).to.have.length(0);
  });
});
