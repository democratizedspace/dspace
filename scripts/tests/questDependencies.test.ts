import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

const questsDir = path.join(__dirname, '../../frontend/src/pages/quests/json');

function loadQuests() {
  const files = globSync(path.join(questsDir, '**/*.json'));
  const quests = {} as Record<string, any>;
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    quests[data.id] = data;
  }
  return quests;
}

describe('quest dependency graph', () => {
  const quests = loadQuests();

  it('references existing quests', () => {
    const missing: string[] = [];
    for (const quest of Object.values(quests)) {
      const deps: string[] = quest.requiresQuests || [];
      for (const dep of deps) {
        if (!quests[dep]) {
          missing.push(`${quest.id} -> ${dep}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('has no circular dependencies', () => {
    const visited = new Set<string>();
    const stack = new Set<string>();
    const cycles: string[] = [];

    function dfs(id: string) {
      if (stack.has(id)) {
        cycles.push(id);
        return;
      }
      if (visited.has(id)) return;
      visited.add(id);
      stack.add(id);
      const deps: string[] = quests[id]?.requiresQuests || [];
      deps.forEach(dfs);
      stack.delete(id);
    }

    Object.keys(quests).forEach(dfs);
    expect(cycles).toEqual([]);
  });
});
