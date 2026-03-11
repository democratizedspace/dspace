import { describe, expect, it } from 'vitest';
import { globSync } from 'glob';
import path from 'path';
import fs from 'fs';

const questsRoot = path.resolve(__dirname, '../../frontend/src/pages/quests/json');

describe('quest id/path consistency', () => {
  it('matches each quest id to its tree directory and filename', () => {
    const mismatches: string[] = [];
    const questFiles = globSync(path.join(questsRoot, '**/*.json'));

    for (const questFile of questFiles) {
      const quest = JSON.parse(fs.readFileSync(questFile, 'utf8'));
      const relativePath = path.relative(questsRoot, questFile).replace(/\\/g, '/');
      const expectedId = relativePath.replace(/\.json$/, '');

      if (quest.id !== expectedId) {
        mismatches.push(`${relativePath}: id="${quest.id}" expected="${expectedId}"`);
      }
    }

    expect(mismatches).toEqual([]);
  });
});
