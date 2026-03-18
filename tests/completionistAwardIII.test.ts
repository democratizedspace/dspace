import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type ItemCount = { id: string; count: number };
type QuestOption = {
  type: string;
  process?: string;
  goto?: string;
  requiresItems?: ItemCount[];
};
type QuestStep = { id: string; options: QuestOption[] };
type Quest = {
  id: string;
  rewards: ItemCount[];
  requiresQuests?: string[];
  dialogue: QuestStep[];
};

type Process = {
  id: string;
  requireItems?: ItemCount[];
  consumeItems?: ItemCount[];
  createItems?: ItemCount[];
};

const questsDir = path.join(__dirname, '../frontend/src/pages/quests/json');
const capstonePath = path.join(
  __dirname,
  '../frontend/src/pages/quests/json/completionist/award-iii.json'
);
const processesPath = path.join(
  __dirname,
  '../frontend/src/generated/processes.json'
);

const completionistAwardIIIItemId = 'adf69f8d-4b30-4eec-b667-43ff5dfd9892';

const expectedProcessSequence = [
  'print-completionist-iii-modules',
  'mill-completionist-iii-wood-base',
  'solder-completionist-iii-harness',
  'integrate-completionist-iii-robotics',
  'assemble-completionist-iii-planter',
  'assemble-completionist-award-iii',
] as const;

const walkJsonFiles = (dir: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJsonFiles(fullPath));
      continue;
    }
    if (entry.isFile() && fullPath.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
};

const loadQuest = (file: string): Quest =>
  JSON.parse(readFileSync(file, 'utf8'));

const loadAllQuests = (): Quest[] => walkJsonFiles(questsDir).map(loadQuest);

const countGrantedItem = (
  entries: ItemCount[] | undefined,
  itemId: string
): number =>
  (entries ?? [])
    .filter((entry) => entry.id === itemId)
    .reduce((total, entry) => total + entry.count, 0);

describe('completionist/award-iii capstone', () => {
  it('remains locked behind every terminal quest when the capstone itself is excluded', () => {
    const allQuests = loadAllQuests();
    const capstone = loadQuest(capstonePath);

    const questsWithoutCapstone = allQuests.filter(
      (quest) => quest.id !== capstone.id
    );
    const idsWithoutCapstone = new Set(
      questsWithoutCapstone.map((quest) => quest.id)
    );
    const dependentCounts = new Map<string, number>(
      questsWithoutCapstone.map((quest) => [quest.id, 0])
    );

    for (const quest of questsWithoutCapstone) {
      for (const dependency of quest.requiresQuests ?? []) {
        if (!idsWithoutCapstone.has(dependency)) {
          continue;
        }
        dependentCounts.set(
          dependency,
          (dependentCounts.get(dependency) ?? 0) + 1
        );
      }
    }

    const terminalIds = [...dependentCounts.entries()]
      .filter(([, dependentCount]) => dependentCount === 0)
      .map(([id]) => id)
      .sort();

    expect((capstone.requiresQuests ?? []).slice().sort()).toEqual(terminalIds);
  });

  it('uses the intended six-step process chain and matching checkpoint gates', () => {
    const capstone = loadQuest(capstonePath);
    const processIdsInOrder = capstone.dialogue
      .flatMap((node) => node.options)
      .filter((option) => option.type === 'process')
      .map((option) => option.process);

    expect(processIdsInOrder).toEqual(expectedProcessSequence);

    const transitionsWithRequiredItems = capstone.dialogue
      .flatMap((node) => node.options)
      .filter(
        (option) =>
          option.type === 'goto' && (option.requiresItems ?? []).length > 0
      );

    expect(transitionsWithRequiredItems).toHaveLength(6);
    expect(
      transitionsWithRequiredItems.every(
        (option) => option.requiresItems?.[0]?.count === 1
      )
    ).toBe(true);
  });

  it('keeps the process chain viable and yields exactly one Completionist Award III', () => {
    const capstone = loadQuest(capstonePath);
    const processes: Process[] = JSON.parse(
      readFileSync(processesPath, 'utf8')
    );
    const byId = new Map(processes.map((process) => [process.id, process]));

    const print = byId.get('print-completionist-iii-modules');
    const wood = byId.get('mill-completionist-iii-wood-base');
    const harness = byId.get('solder-completionist-iii-harness');
    const robotics = byId.get('integrate-completionist-iii-robotics');
    const planter = byId.get('assemble-completionist-iii-planter');
    const finalAssembly = byId.get('assemble-completionist-award-iii');

    expect(print?.createItems?.[0]?.id).toBe(
      'be9cb892-f4b2-45fd-ae2b-34d3190acb59'
    );
    expect(wood?.createItems?.[0]?.id).toBe(
      'fd54da0d-cf87-4860-bf74-df3be8a95f90'
    );
    expect(harness?.createItems?.[0]?.id).toBe(
      '37f159f8-e8a2-4721-9608-c4b25855092e'
    );

    expect(robotics?.requireItems?.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'be9cb892-f4b2-45fd-ae2b-34d3190acb59',
        '37f159f8-e8a2-4721-9608-c4b25855092e',
      ])
    );
    expect(planter?.requireItems?.map((item) => item.id)).toEqual(
      expect.arrayContaining(['e6f5d8eb-1ce2-4a91-b9f4-3bbac465018b'])
    );
    expect(finalAssembly?.requireItems?.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'fd54da0d-cf87-4860-bf74-df3be8a95f90',
        'ba8cc7ec-f6c9-429a-aa7d-4bf8f513f4c9',
      ])
    );

    const processAwardCount = countGrantedItem(
      finalAssembly?.createItems,
      completionistAwardIIIItemId
    );
    const questAwardCount = countGrantedItem(
      capstone.rewards,
      completionistAwardIIIItemId
    );
    expect(processAwardCount + questAwardCount).toBe(1);

    const finishNode = capstone.dialogue.find((node) => node.id === 'finish');
    const finalAssemblyNode = capstone.dialogue.find(
      (node) => node.id === 'final-assembly'
    );
    const toFinishOption = finalAssemblyNode?.options.find(
      (option) => option.goto === 'finish'
    );

    expect(toFinishOption?.requiresItems?.[0]).toEqual({
      id: completionistAwardIIIItemId,
      count: 1,
    });
    expect(finishNode?.options.some((option) => option.type === 'finish')).toBe(
      true
    );
  });
});
