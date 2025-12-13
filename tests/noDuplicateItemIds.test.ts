import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';

// Verify that no two items across category files share the same `id`.

describe('inventory data ‑ unique item IDs', () => {
  const itemsDir = join(
    __dirname,
    '..',
    'frontend',
    'src',
    'pages',
    'inventory',
    'json',
    'items',
  );

  const ids = new Map<string, string>();
  const duplicates: Array<{ id: string; fileA: string; fileB: string }> = [];

  readdirSync(itemsDir, { withFileTypes: true }).forEach((dirent) => {
    if (dirent.isFile() && extname(dirent.name) === '.json' && dirent.name !== 'index.js') {
      const fullPath = join(itemsDir, dirent.name);
      const json = JSON.parse(readFileSync(fullPath, 'utf8')) as Array<{ id: string }>;
      json.forEach(({ id }) => {
        if (!id) return; // some placeholder objects may omit id for tests
        if (ids.has(id)) {
          duplicates.push({ id, fileA: ids.get(id)!, fileB: dirent.name });
        } else {
          ids.set(id, dirent.name);
        }
      });
    }
  });

  it('ensures all item IDs are unique across category files', () => {
    const message = duplicates
      .map((d) => `ID ${d.id} duplicated in ${d.fileA} and ${d.fileB}`)
      .join('\n');
    expect(duplicates, message).to.have.length(0);
  });
});
