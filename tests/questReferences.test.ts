import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const questsDir = path.join(__dirname, '../frontend/src/pages/quests/json');
interface Item {
  id: string;
  image?: string;
}
const items: Item[] = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../frontend/src/pages/inventory/json/items.json'),
    'utf8'
  )
);
const itemMap = new Map<string, Item>(items.map((i) => [i.id, i]));
const itemIds = new Set(itemMap.keys());
const processes = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../frontend/src/pages/processes/processes.json'),
    'utf8'
  )
);
const processIds = new Set(processes.map((p: any) => p.id));
const assetsDir = path.join(__dirname, '../frontend/public');

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(res);
    else if (res.endsWith('.json')) yield res;
  }
}

const questFiles = Array.from(walk(questsDir));
const questIds = new Set<string>();
questFiles.forEach((f) => {
  const q = JSON.parse(fs.readFileSync(f, 'utf8'));
  questIds.add(q.id);
});

describe('quest references', () => {
  it('quests reference existing items, processes and quests', () => {
    const missing: string[] = [];
    function verifyItem(id: string, questId: string) {
      if (!itemIds.has(id)) {
        missing.push(`${questId} missing item ${id}`);
        return;
      }
      const item = itemMap.get(id);
      if (!item.image) {
        missing.push(`item ${id} missing image`);
        return;
      }
      const imgPath = path.join(assetsDir, item.image.replace(/^\//, ''));
      if (!fs.existsSync(imgPath))
        missing.push(`item ${id} missing asset ${item.image}`);
    }
    for (const file of questFiles) {
      const quest = JSON.parse(fs.readFileSync(file, 'utf8'));
      (quest.requiresQuests || []).forEach((qid: string) => {
        if (!questIds.has(qid))
          missing.push(`${quest.id} requires quest ${qid}`);
      });
      (quest.dialogue || []).forEach((node: any) => {
        (node.options || []).forEach((opt: any) => {
          (opt.requiresItems || []).forEach((i: any) =>
            verifyItem(i.id, quest.id)
          );
          (opt.grantsItems || []).forEach((i: any) =>
            verifyItem(i.id, quest.id)
          );
          if (
            opt.process &&
            !processIds.has(opt.process) &&
            !['neutralize-acid', 'hand-crank-50Wh'].includes(opt.process)
          ) {
            missing.push(`${quest.id} missing process ${opt.process}`);
          }
        });
      });
    }
    expect(missing).toEqual([]);
  });
});

describe('process durations', () => {
  it('use recognized units and rough real-world scale', () => {
    const bad: string[] = [];
    for (const p of processes) {
      const m = /^(\d+\s*(s|m|h|d|w)\s*)+$/.exec(p.duration || '');
      if (!m) {
        bad.push(`${p.id} has invalid duration ${p.duration}`);
        continue;
      }
      const units = (p.duration.match(/(s|m|h|d|w)/g) || []) as string[];
      const smallest = units[units.length - 1];
      if (p.id.includes('grow') && !units.some((u) => u === 'd' || u === 'w'))
        bad.push(`${p.id} too short`);
      if (p.id.includes('charge') && smallest === 's')
        bad.push(`${p.id} too short`);
      if (p.id.includes('flight') && (smallest === 's' || smallest === 'm'))
        bad.push(`${p.id} too short`);
    }
    expect(bad).toEqual([]);
  });
});
