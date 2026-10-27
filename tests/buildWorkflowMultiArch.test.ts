import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

describe('build workflow multi-arch publishing', () => {
  const workflowPath = join(repoRoot, '.github', 'workflows', 'build.yml');
  const contents = readFileSync(workflowPath, 'utf8');

  it('builds linux/amd64 and linux/arm64 images', () => {
    expect(contents).toMatch(/platforms:\s*linux\/amd64,linux\/arm64/);
  });

  it('publishes immutable sha tags to ghcr', () => {
    expect(contents).toMatch(/type=sha,format=long,prefix=sha-/);
    expect(contents).toMatch(/REGISTRY:\s*ghcr\.io/);
  });

  it('does not rebuild or publish on the post-cutover release tag', () => {
    const workflow = parse(contents);
    expect(workflow.on.push.tags).toBeUndefined();
    expect(workflow.env.PUSH_IMAGE).toContain(
      "github.ref == 'refs/heads/main'"
    );
    expect(workflow.env.PUSH_IMAGE).not.toContain('refs/tags/');
    expect(contents).not.toContain('type=semver');
  });
});
