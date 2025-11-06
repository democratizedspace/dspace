import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

describe('June 30, 2023 changelog AI companion note', () => {
  it('preserves the roadmap language and points to the v3 follow-up', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const changelogPath = resolve(
      currentDir,
      '../frontend/src/pages/docs/md/changelog/20230630.md'
    );
    const doc = readFileSync(changelogPath, 'utf8');

    expect(doc).toMatch(
      /In upcoming versions, I'll be leveraging large language models/i
    );
    expect(doc).toMatch(
      /title:\s*['"]November 1, 2025 – GPT-powered dChat['"]/i
    );
    expect(doc).toMatch(/slug:\s*['"]20251101['"]/i);
  });
});
