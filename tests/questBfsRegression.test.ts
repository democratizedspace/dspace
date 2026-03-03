import { describe, expect, it } from 'vitest';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };
import items from '../frontend/src/pages/inventory/json/items';
import { loadQuests } from '../scripts/gen-quest-tree.mjs';

type ItemEntry = { id: string; count?: number };

const toItemIds = (entries: ItemEntry[] | undefined) =>
  (entries ?? []).map((entry) => entry.id);

const toItemIdsFromUnknown = (value: unknown) => {
  if (!value) return [] as string[];
  if (Array.isArray(value)) {
    if (value.length === 0) return [] as string[];
    if (typeof value[0] === 'string')
      return (value as string[]).filter(Boolean);
    return (value as ItemEntry[]).map((entry) => entry.id).filter(Boolean);
  }
  if (typeof value === 'string') return [value];
  if (typeof value === 'object' && value && 'id' in value) {
    const entry = value as ItemEntry;
    return entry.id ? [entry.id] : [];
  }
  return [] as string[];
};

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

const getRequiredItemIds = (option: any) =>
  unique([
    ...toItemIdsFromUnknown(option?.requiresItems),
    ...toItemIdsFromUnknown(option?.requiredItems),
    ...toItemIdsFromUnknown(option?.requiredItemIds),
    ...toItemIdsFromUnknown(option?.requiredItemId),
  ]);

const getQuestLevelRequiredItemIds = (quest: any) =>
  unique([
    ...toItemIdsFromUnknown(quest?.requiresItems),
    ...toItemIdsFromUnknown(quest?.requiredItems),
    ...toItemIdsFromUnknown(quest?.requiredItemIds),
    ...toItemIdsFromUnknown(quest?.requiredItemId),
  ]);

const getFinishOptions = (quest: any) =>
  (quest.dialogue ?? []).flatMap((node: any) =>
    (node.options ?? []).filter((option: any) => option.type === 'finish')
  );

const getGrantedItems = (quest: any) =>
  (quest.dialogue ?? []).flatMap((node: any) =>
    (node.options ?? []).flatMap((option: any) => toItemIds(option.grantsItems))
  );

const getRequiredItemsFromFinishReachableTransitions = (quest: any) => {
  const dialogue = quest.dialogue ?? [];
  const idToNode = new Map(
    dialogue
      .filter((node: any) => typeof node?.id === 'string' && node.id.trim())
      .map((node: any) => [node.id.trim(), node])
  );
  const startId = typeof quest.start === 'string' ? quest.start.trim() : '';
  if (!startId || !idToNode.has(startId)) return [] as string[];

  const reverseEdges = new Map<string, string[]>();
  for (const node of dialogue) {
    const nodeId = node.id?.trim?.();
    if (!nodeId) continue;
    for (const option of node.options ?? []) {
      if (option.type !== 'goto' || typeof option.goto !== 'string') continue;
      const target = option.goto.trim();
      if (!idToNode.has(target)) continue;
      if (!reverseEdges.has(target)) reverseEdges.set(target, []);
      reverseEdges.get(target)!.push(nodeId);
    }
  }

  const canReachFinish = new Set<string>();
  const q: string[] = [];
  for (const node of dialogue) {
    const nodeId = node.id?.trim?.();
    if (!nodeId) continue;
    if ((node.options ?? []).some((option: any) => option.type === 'finish')) {
      canReachFinish.add(nodeId);
      q.push(nodeId);
    }
  }
  while (q.length > 0) {
    const nodeId = q.shift()!;
    for (const prev of reverseEdges.get(nodeId) ?? []) {
      if (canReachFinish.has(prev)) continue;
      canReachFinish.add(prev);
      q.push(prev);
    }
  }

  const seen = new Set<string>();
  const walk = [startId];
  const required = new Set<string>();
  while (walk.length > 0) {
    const nodeId = walk.shift()!;
    if (seen.has(nodeId)) continue;
    seen.add(nodeId);
    const node = idToNode.get(nodeId);
    if (!node) continue;

    for (const option of node.options ?? []) {
      if (option.type !== 'goto' || typeof option.goto !== 'string') continue;
      const target = option.goto.trim();
      if (!idToNode.has(target)) continue;
      if (canReachFinish.has(nodeId) && canReachFinish.has(target)) {
        for (const itemId of getRequiredItemIds(option)) required.add(itemId);
      }
      if (!seen.has(target)) walk.push(target);
    }
  }

  return [...required];
};

const computeObtainableItems = (allItems: any[], allQuests: any[]) => {
  const obtainable = new Set<string>();
  const completableQuests = new Set<string>();
  const itemMap = new Map(allItems.map((item) => [item.id, item]));
  let changed = true;

  while (changed) {
    changed = false;

    for (const item of allItems) {
      if (!item.price || obtainable.has(item.id)) continue;
      const deps = toItemIdsFromUnknown(item.dependencies);
      if (deps.every((id) => itemMap.has(id) && obtainable.has(id))) {
        obtainable.add(item.id);
        changed = true;
      }
    }

    for (const process of processes as any[]) {
      const req = [
        ...toItemIds(process.requireItems),
        ...toItemIds(process.consumeItems),
      ];
      if (!req.every((id) => obtainable.has(id))) continue;
      for (const created of toItemIds(process.createItems)) {
        if (obtainable.has(created)) continue;
        obtainable.add(created);
        changed = true;
      }
    }

    for (const quest of allQuests) {
      if (completableQuests.has(quest.id)) continue;
      if (
        (quest.requiresQuests ?? []).some(
          (id: string) => !completableQuests.has(id)
        )
      )
        continue;
      const finishOptions = getFinishOptions(quest);
      if (finishOptions.length === 0) continue;

      const required = unique([
        ...getQuestLevelRequiredItemIds(quest),
        ...getRequiredItemsFromFinishReachableTransitions(quest),
        ...finishOptions.flatMap((option: any) => getRequiredItemIds(option)),
      ]);

      if (!required.every((id) => obtainable.has(id))) continue;
      completableQuests.add(quest.id);
      for (const reward of [
        ...toItemIds(quest.rewards),
        ...getGrantedItems(quest),
      ]) {
        if (!obtainable.has(reward)) {
          obtainable.add(reward);
          changed = true;
        }
      }
    }
  }

  return obtainable;
};

const hasFeasibleFinishPath = (quest: any, obtainable: Set<string>) => {
  const idToNode = new Map(
    (quest.dialogue ?? [])
      .filter((node: any) => typeof node?.id === 'string' && node.id.trim())
      .map((node: any) => [node.id.trim(), node])
  );
  const startId = typeof quest.start === 'string' ? quest.start.trim() : '';
  if (!startId || !idToNode.has(startId)) return false;

  const seen = new Set<string>();
  const queue = [startId];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (seen.has(nodeId)) continue;
    seen.add(nodeId);
    const node = idToNode.get(nodeId);
    if (!node) continue;
    for (const option of node.options ?? []) {
      if (!getRequiredItemIds(option).every((id) => obtainable.has(id)))
        continue;
      if (option.type === 'finish') return true;
      if (
        option.type === 'goto' &&
        typeof option.goto === 'string' &&
        idToNode.has(option.goto.trim())
      ) {
        queue.push(option.goto.trim());
      }
    }
  }
  return false;
};

describe('quest BFS completion regression for unobtainable required items', () => {
  it('keeps key quests completable without relying on BETA_PLACEHOLDER items', async () => {
    const quests = await loadQuests();
    const questMap = new Map(
      (quests as any[]).map((quest) => [quest.id, quest])
    );
    const obtainable = computeObtainableItems(items as any[], quests as any[]);

    const regressionQuestIds = [
      'rocketry/parachute',
      'devops/docker-compose',
      'geothermal/install-backup-thermistor',
      'geothermal/replace-faulty-thermistor',
    ];

    for (const questId of regressionQuestIds) {
      const quest = questMap.get(questId);
      expect(quest, `Missing quest: ${questId}`).toBeDefined();
      expect(
        hasFeasibleFinishPath(quest, obtainable),
        `No feasible finish path: ${questId}`
      ).toBe(true);
    }
  });
});
