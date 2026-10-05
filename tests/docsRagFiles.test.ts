import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { glob } from 'glob';
import { globDocsFiles } from '../scripts/docs-rag-files.mjs';

describe('docs RAG source discovery', () => {
  let fixture = '';

  beforeEach(async () => {
    fixture = '';
    fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'dspace rag files-'));
    await fs.mkdir(path.join(fixture, 'changelog'), { recursive: true });
    await fs.mkdir(path.join(fixture, 'nested', 'directory.md'), {
      recursive: true,
    });
    await Promise.all(
      [
        'about.md',
        'changelog.md',
        'changelog/20260801.md',
        'nested/guide.md',
        'ignored.txt',
      ].map((name) => fs.writeFile(path.join(fixture, name), '# Fixture\n'))
    );
  });

  afterEach(async () => {
    if (!fixture) return;
    expect(path.dirname(fixture)).toBe(path.resolve(os.tmpdir()));
    expect(path.basename(fixture)).toMatch(/^dspace rag files-/);
    await fs.rm(fixture, { recursive: true, force: true });
  });

  const pathStyles = [
    ['native', (value: string) => value],
    ['forward-slash', (value: string) => value.replaceAll('\\', '/')],
    ['backslash', (value: string) => value.replaceAll('/', '\\')],
  ] as const;

  it.each(pathStyles)(
    'discovers nested Markdown with %s absolute paths',
    async (_, format) => {
      const files = await globDocsFiles(
        format(path.join(fixture, '**', '*.md'))
      );
      expect(files.sort()).toEqual(
        ['about.md', 'changelog.md', 'changelog/20260801.md', 'nested/guide.md']
          .map((name) => path.join(fixture, name))
          .sort()
      );
    }
  );

  it.each(pathStyles)(
    'discovers both changelog patterns with %s absolute paths',
    async (_, format) => {
      const index = await globDocsFiles(
        format(path.join(fixture, 'changelog*.md'))
      );
      const entries = await globDocsFiles(
        format(path.join(fixture, 'changelog', '*.md'))
      );
      expect(index).toEqual([path.join(fixture, 'changelog.md')]);
      expect(entries).toEqual([path.join(fixture, 'changelog', '20260801.md')]);
      // The generator uses native separators to exclude archive entries from ordinary docs.
      expect(entries[0]).toContain(`${path.sep}changelog${path.sep}`);
    }
  );

  it('preserves the file set produced by normalized glob patterns', async () => {
    const pattern = path.join(fixture, '**', '*.md').replaceAll('\\', '/');
    const expected = (await glob(pattern, { nodir: true })).map((file) =>
      path.normalize(file)
    );
    expect((await globDocsFiles(pattern)).sort()).toEqual(expected.sort());
  });
});
