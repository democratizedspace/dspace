import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type QuestOption = {
  type: string;
  process?: string;
};

type QuestDialogueNode = {
  id: string;
  text?: string;
  options?: QuestOption[];
};

type QuestDefinition = {
  dialogue?: QuestDialogueNode[];
  rewards?: Array<{ id: string; count: number }>;
};

type ProcessDefinition = {
  id: string;
  consumeItems?: Array<{ id: string; count: number }>;
};

const repoRoot = path.resolve(__dirname, '..');

function readJson<T>(relativePath: string): T {
  const filePath = path.join(repoRoot, relativePath);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

describe('composting quest regressions', () => {
  it('composting/start includes item-page process navigation hints', () => {
    const quest = readJson<QuestDefinition>(
      'frontend/src/pages/quests/json/composting/start.json'
    );
    const dialogueText = (quest.dialogue ?? [])
      .map((node) => node.text ?? '')
      .join('\n')
      .toLowerCase();

    expect(dialogueText).toContain('processes live on item pages');
    expect(dialogueText).toContain('processes section');
  });

  it('composting/start includes quiz nodes, process action, and rewards', () => {
    const quest = readJson<QuestDefinition>(
      'frontend/src/pages/quests/json/composting/start.json'
    );
    const quizNodeCount = (quest.dialogue ?? []).filter((node) =>
      node.id.startsWith('quiz-')
    ).length;
    const processOptionCount = (quest.dialogue ?? [])
      .flatMap((node) => node.options ?? [])
      .filter(
        (option) =>
          option.type === 'process' && option.process === 'start-compost-bin'
      ).length;

    expect(quizNodeCount).toBeGreaterThanOrEqual(6);
    expect(processOptionCount).toBeGreaterThan(0);
    expect(quest.rewards?.length ?? 0).toBeGreaterThan(0);
  });

  it('composting/check-temperature requires rerun logs before recheck and cooldown', () => {
    const quest = readJson<QuestDefinition>(
      'frontend/src/pages/quests/json/composting/check-temperature.json'
    );
    const probeNode = (quest.dialogue ?? []).find(
      (node) => node.id === 'probe'
    );
    const recheckNode = (quest.dialogue ?? []).find(
      (node) => node.id === 'recheck'
    );
    const cooldownNode = (quest.dialogue ?? []).find(
      (node) => node.id === 'cooldown'
    );

    expect((quest.dialogue ?? []).some((node) => node.id === 'moisture')).toBe(
      false
    );

    const probeGate = (probeNode?.options ?? []).find(
      (
        option: QuestOption & {
          goto?: string;
          requiresItems?: Array<{ id: string; count: number }>;
        }
      ) => option.type === 'goto' && option.goto === 'recheck'
    );

    expect(probeGate?.requiresItems).toEqual([
      { id: 'e034d081-a29e-4040-830f-a192304db50d', count: 2 },
      { id: '723f5795-735c-46ee-8a33-30a3a403cdfd', count: 2 },
    ]);

    const recheckGate = (recheckNode?.options ?? []).find(
      (
        option: QuestOption & {
          goto?: string;
          requiresItems?: Array<{ id: string; count: number }>;
        }
      ) => option.type === 'goto' && option.goto === 'cooldown'
    );

    expect(recheckGate?.requiresItems).toEqual([
      { id: 'e034d081-a29e-4040-830f-a192304db50d', count: 3 },
      { id: '723f5795-735c-46ee-8a33-30a3a403cdfd', count: 2 },
    ]);

    const finishGate = (cooldownNode?.options ?? []).find(
      (
        option: QuestOption & {
          goto?: string;
          requiresItems?: Array<{ id: string; count: number }>;
        }
      ) => option.type === 'goto' && option.goto === 'finish'
    );

    expect(finishGate?.requiresItems).toEqual([
      { id: 'b281360b-2ecc-4fea-a248-36a61c5f7399', count: 1 },
      { id: 'e034d081-a29e-4040-830f-a192304db50d', count: 3 },
      { id: '723f5795-735c-46ee-8a33-30a3a403cdfd', count: 2 },
    ]);
  });

  it('start-compost-bin process consumes organic matter inputs', () => {
    const processes = readJson<ProcessDefinition[]>(
      'frontend/src/pages/processes/base.json'
    );
    const compostProcess = processes.find(
      (process) => process.id === 'start-compost-bin'
    );

    expect(compostProcess).toBeDefined();
    expect(compostProcess?.consumeItems?.length ?? 0).toBeGreaterThan(0);

    const consumedItemIds = new Set(
      (compostProcess?.consumeItems ?? []).map((item) => item.id)
    );
    expect(consumedItemIds.has('5d48cefb-fc1f-4962-b2c6-9b014151d0ae')).toBe(
      true
    );
  });
});
