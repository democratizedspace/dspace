import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import update from '../scripts/update-new-quests.js';

type Group = { tree: string; quests: string[] };
type Section = {
  version: string;
  prevCount: number;
  currentCount: number;
  groups: Group[];
  newCount: number;
};

const { getReleaseSections, generateMarkdown } = update as {
  getReleaseSections: () => Section[];
  generateMarkdown: (sections: Section[]) => string;
};

const listPath = path.join(
  __dirname,
  '../frontend/src/pages/docs/md/new-quests.md'
);

describe('new quests list', () => {
  it('matches generated markdown', () => {
    const sections = getReleaseSections();
    const expected = generateMarkdown(sections);
    const actual = fs.readFileSync(listPath, 'utf8');
    expect(actual).toBe(expected);
  });

  it('counts quests correctly for each release', () => {
    const sections = getReleaseSections();
    sections.forEach((section) => {
      const counted = section.groups.reduce(
        (sum, g) => sum + g.quests.length,
        0
      );
      expect(section.newCount).toBe(counted);
      expect(section.currentCount).toBeGreaterThanOrEqual(section.prevCount);
    });
  });

  it('is up-to-date when regenerated', () => {
    const before = fs.readFileSync(listPath, 'utf8');
    execSync('node scripts/update-new-quests.js');
    const after = fs.readFileSync(listPath, 'utf8');
    fs.writeFileSync(listPath, before);
    expect(
      after,
      'Run `npm run new-quests:update` and commit the changes.'
    ).toBe(before);
  });
});
