import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadQuestPaths } from './utils/questPaths';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };
import items from '../frontend/src/pages/inventory/json/items';

type ItemCount = { id: string; count: number };
type QuestOption = {
  type?: string;
  goto?: string;
  process?: string;
  requiresItems?: ItemCount[];
  grantsItems?: ItemCount[];
};
type QuestNode = { id?: string; options?: QuestOption[] };
type QuestData = {
  id: string;
  start?: string;
  requiresItems?: ItemCount[];
  requiresQuests?: string[];
  rewards?: ItemCount[];
  dialogue?: QuestNode[];
};
type ProcessData = {
  id: string;
  consumeItems?: ItemCount[];
  createItems?: ItemCount[];
};

const processMap = new Map((processes as ProcessData[]).map((process) => [process.id, process]));
const purchasableItems = new Set(
  (items as Array<{ id: string; price?: number; priceExemptionReason?: string }>)
    .filter(
      (item) =>
        (typeof item.price === 'number' && item.price > 0) ||
        item.priceExemptionReason === 'BETA_PLACEHOLDER'
    )
    .map((item) => item.id)
);

const addItem = (inventory: Map<string, number>, itemId: string, count: number) => {
  if (!itemId || !Number.isFinite(count) || count === 0) return;
  inventory.set(itemId, (inventory.get(itemId) ?? 0) + count);
};

const applyItems = (inventory: Map<string, number>, entries: ItemCount[] = [], sign = 1) => {
  for (const entry of entries) {
    addItem(inventory, entry.id, sign * Number(entry.count ?? 0));
  }
};

const hasItems = (inventory: Map<string, number>, requirements: ItemCount[] = []) =>
  requirements.every((entry) => (inventory.get(entry.id) ?? 0) >= Number(entry.count ?? 0));

const buyMissing = (inventory: Map<string, number>, requirements: ItemCount[] = []) => {
  for (const entry of requirements) {
    const required = Number(entry.count ?? 0);
    const current = inventory.get(entry.id) ?? 0;
    if (current >= required || !purchasableItems.has(entry.id)) continue;
    inventory.set(entry.id, required);
  }
};

const simulateQuestCompletion = (quest: QuestData, initialInventory: Map<string, number>) => {
  const inventory = new Map(initialInventory);
  buyMissing(inventory, quest.requiresItems ?? []);

  const nodeById = new Map<string, QuestNode>();
  for (const node of quest.dialogue ?? []) {
    if (typeof node.id === 'string' && node.id.trim()) nodeById.set(node.id.trim(), node);
  }

  const startNode =
    typeof quest.start === 'string' && quest.start.trim()
      ? quest.start.trim()
      : (quest.dialogue?.[0]?.id ?? '').trim();
  if (!startNode || !nodeById.has(startNode)) return inventory;

  let current = startNode;
  const executedProcesses = new Set<string>();
  let guard = 0;

  while (guard++ < 1000) {
    const node = nodeById.get(current);
    if (!node) break;

    for (const option of node.options ?? []) {
      buyMissing(inventory, option.requiresItems ?? []);
    }

    for (const option of node.options ?? []) {
      if (option.type !== 'process' || typeof option.process !== 'string') continue;
      const processKey = `${current}:${option.process}`;
      if (executedProcesses.has(processKey)) continue;
      if (!hasItems(inventory, option.requiresItems ?? [])) continue;

      const process = processMap.get(option.process);
      if (!process) continue;
      if (!hasItems(inventory, process.consumeItems ?? [])) continue;

      executedProcesses.add(processKey);
      applyItems(inventory, option.grantsItems ?? [], 1);
      applyItems(inventory, process.consumeItems ?? [], -1);
      applyItems(inventory, process.createItems ?? [], 1);
    }

    const finish = (node.options ?? []).find(
      (option) => option.type === 'finish' && hasItems(inventory, option.requiresItems ?? [])
    );
    if (finish) {
      applyItems(inventory, finish.grantsItems ?? [], 1);
      applyItems(inventory, quest.rewards ?? [], 1);
      return inventory;
    }

    const next = (node.options ?? []).find(
      (option) =>
        option.type === 'goto' &&
        typeof option.goto === 'string' &&
        hasItems(inventory, option.requiresItems ?? [])
    );
    if (!next || typeof next.goto !== 'string') break;

    applyItems(inventory, next.grantsItems ?? [], 1);
    current = next.goto.trim();
  }

  return inventory;
};

const canFinishWithoutProcess = (quest: QuestData, initialInventory: Map<string, number>) => {
  const inventory = new Map(initialInventory);
  buyMissing(inventory, quest.requiresItems ?? []);

  const nodeById = new Map<string, QuestNode>();
  for (const node of quest.dialogue ?? []) {
    if (typeof node.id === 'string' && node.id.trim()) nodeById.set(node.id.trim(), node);
  }

  const startNode =
    typeof quest.start === 'string' && quest.start.trim()
      ? quest.start.trim()
      : (quest.dialogue?.[0]?.id ?? '').trim();
  if (!startNode || !nodeById.has(startNode)) return false;

  const queue = [startNode];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (seen.has(current)) continue;
    seen.add(current);

    const node = nodeById.get(current);
    if (!node) continue;

    for (const option of node.options ?? []) {
      if (option.type === 'process') continue;
      buyMissing(inventory, option.requiresItems ?? []);
      if (!hasItems(inventory, option.requiresItems ?? [])) continue;
      if (option.type === 'finish') return true;
      if (option.type === 'goto' && typeof option.goto === 'string' && nodeById.has(option.goto.trim())) {
        queue.push(option.goto.trim());
      }
    }
  }

  return false;
};

describe('astronomy quest quality gates', () => {
  it('does not hide process ids on non-process options', async () => {
    const questPaths = await loadQuestPaths();
    const violations: string[] = [];

    for (const questPath of questPaths.values()) {
      const quest = JSON.parse(await readFile(path.join(process.cwd(), questPath), 'utf8')) as QuestData;
      if (!quest.id.startsWith('astronomy/')) continue;

      for (const node of quest.dialogue ?? []) {
        for (const option of node.options ?? []) {
          if (!option.process || option.type === 'process') continue;
          violations.push(`${quest.id}:${node.id ?? 'unknown'}:${option.type ?? 'unknown'}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('requires at least one process execution to finish each astronomy quest', async () => {
    const questPaths = await loadQuestPaths();
    const quests = await Promise.all(
      [...questPaths.values()].map(async (questPath) => {
        const raw = await readFile(path.join(process.cwd(), questPath), 'utf8');
        return JSON.parse(raw) as QuestData;
      })
    );

    const astronomyQuests = quests.filter((quest) => quest.id.startsWith('astronomy/'));
    const questsById = new Map(quests.map((quest) => [quest.id, quest]));
    const violations: string[] = [];

    const buildInventory = (questId: string, visited = new Set<string>()) => {
      const inventory = new Map<string, number>();
      const quest = questsById.get(questId);
      for (const prereqId of quest?.requiresQuests ?? []) {
        if (visited.has(prereqId)) continue;
        visited.add(prereqId);
        const prereqInventory = buildInventory(prereqId, visited);
        for (const [id, count] of prereqInventory.entries()) {
          inventory.set(id, (inventory.get(id) ?? 0) + count);
        }

        const prereqQuest = questsById.get(prereqId);
        if (prereqQuest) {
          const completed = simulateQuestCompletion(prereqQuest, inventory);
          for (const [id, count] of completed.entries()) {
            inventory.set(id, count);
          }
        }
      }
      return inventory;
    };

    for (const quest of astronomyQuests) {
      const inventoryBefore = buildInventory(quest.id);
      if (canFinishWithoutProcess(quest, inventoryBefore)) {
        violations.push(quest.id);
      }
    }

    expect(violations).toEqual([]);
  });
});
