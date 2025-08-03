import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import glob from 'glob';

const questsDir = path.join(__dirname, '../../frontend/src/pages/quests/json');
const items = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../../frontend/src/pages/inventory/json/items.json'),
    'utf8'
  )
);
const processes = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../../frontend/src/pages/processes/processes.json'),
    'utf8'
  )
);
const itemIds = new Set(items.map((i: any) => String(i.id)));
const processIds = new Set(processes.map((p: any) => p.id));

function loadQuests() {
  return glob.sync(path.join(questsDir, '**/*.json'));
}

describe('Quest quality', () => {
  test('quests reference only known items and processes', () => {
    const issues: string[] = [];
    for (const file of loadQuests()) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const node of data.dialogue ?? []) {
        for (const opt of node.options ?? []) {
          if (opt.requiresItems) {
            for (const ref of opt.requiresItems) {
              const id = String(ref.id);
              if (!itemIds.has(id)) {
                issues.push(`${data.id} references unknown item ${id}`);
              }
            }
          }
          if (opt.process && !processIds.has(opt.process)) {
            issues.push(`${data.id} references unknown process ${opt.process}`);
          }
        }
      }
    }
    if (issues.length > 0) {
      console.warn('Quest quality issues:');
      for (const issue of issues) {
        console.warn(`- ${issue}`);
      }
    }
    expect(issues.length).toBe(0);
  });
});
