import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const questsRoot = path.join(repoRoot, 'frontend', 'src', 'pages', 'quests', 'json');

describe('quest id/path consistency', () => {
  it('matches each quest id to its tree/filename path', () => {
    const trees = readdirSync(questsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
    const mismatches: string[] = [];

    trees.forEach((treeEntry) => {
      const tree = treeEntry.name;
      const treeDir = path.join(questsRoot, tree);
      const questFiles = readdirSync(treeDir).filter((file) => file.endsWith('.json'));

      questFiles.forEach((file) => {
        const filePath = path.join(treeDir, file);
        const quest = JSON.parse(readFileSync(filePath, 'utf8')) as { id?: string };
        const expectedId = `${tree}/${path.basename(file, '.json')}`;

        if (quest.id !== expectedId) {
          mismatches.push(`${path.relative(repoRoot, filePath)} has id "${quest.id}" (expected "${expectedId}")`);
        }
      });
    });

    expect(
      mismatches,
      `Quest IDs must match tree/filename paths:\n${mismatches.join('\n')}`
    ).toEqual([]);
  });
});
