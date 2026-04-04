import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const manifestPath = resolve(
  process.cwd(),
  'frontend/src/generated/quests/listManifest.json'
);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

describe('generated quest list manifest', () => {
  test('is deterministically sorted by id', () => {
    const ids = manifest.map((entry: { id: string }) => entry.id);
    const sorted = [...ids].sort((a, b) => a.localeCompare(b));
    expect(ids).toEqual(sorted);
  });

  test('contains normalized list fields and excludes dialogue payload', () => {
    const entry = manifest[0];
    expect(entry).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      image: expect.any(String),
      requiresQuests: expect.any(Array),
      route: expect.any(String),
      questPath: expect.any(String),
    });
    expect(entry.dialogue).toBeUndefined();
    expect(entry.default).toBeUndefined();
  });
});
