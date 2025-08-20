import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const QUEST_DIR = path.join(__dirname, '../frontend/src/pages/quests/json');
const BASE_COMMIT = 'd956e807d49114da2d0ff28aacef91341813bf82'; // v2.1

function listQuestFiles(commit?: string): string[] {
  if (commit) {
    const output = execSync(
      `git ls-tree -r --name-only ${commit} ${QUEST_DIR}`,
      { encoding: 'utf8' }
    );
    return output.trim().split(/\n/).filter(Boolean);
  }
  const files: string[] = [];
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.json')) files.push(full);
    }
  }
  walk(QUEST_DIR);
  return files;
}

describe('quest count', () => {
  it('has increased at least 10x since v2.1', () => {
    const prev = listQuestFiles(BASE_COMMIT).length;
    const current = listQuestFiles().length;
    const ratio = current / prev;
    expect(ratio).toBeGreaterThanOrEqual(10);
  });
});
