import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import update from '../scripts/update-new-quests-v3.js';

const { getNewQuestPaths, groupQuests, generateMarkdown } = update as {
  getNewQuestPaths: () => string[];
  groupQuests: (paths: string[]) => Array<{ tree: string; quests: string[] }>;
  generateMarkdown: (
    groups: Array<{ tree: string; quests: string[] }>
  ) => string;
};

const listPath = path.join(
  __dirname,
  '../frontend/src/pages/docs/md/new-quests-v3.md'
);

describe('new quests v3 list', () => {
  it('matches quests added since main', () => {
    const paths = getNewQuestPaths();
    const groups = groupQuests(paths);
    const expected = generateMarkdown(groups);
    const actual = fs.readFileSync(listPath, 'utf8');
    expect(actual).toBe(expected);
  });

  it('is up-to-date when regenerated', () => {
    const before = fs.readFileSync(listPath, 'utf8');
    execSync('node scripts/update-new-quests-v3.js');
    const after = fs.readFileSync(listPath, 'utf8');
    expect(after).toBe(before);
  });
});
