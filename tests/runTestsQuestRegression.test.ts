import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type QuestOption = {
  type?: string;
  process?: string;
};

type QuestDialogueNode = {
  options?: QuestOption[];
};

type Quest = {
  dialogue?: QuestDialogueNode[];
};

type ProcessItem = {
  id: string;
  count: number;
};

type Process = {
  id: string;
  createItems?: ProcessItem[];
};

describe('welcome/run-tests process regression guard', () => {
  const questPath = resolve(process.cwd(), 'frontend/src/pages/quests/json/welcome/run-tests.json');
  const processPath = resolve(process.cwd(), 'frontend/src/pages/processes/base.json');

  it('keeps required process steps wired in the quest dialogue', () => {
    const quest = JSON.parse(readFileSync(questPath, 'utf8')) as Quest;
    const processIds = new Set(
      (quest.dialogue ?? [])
        .flatMap((node) => node.options ?? [])
        .filter((option) => option.type === 'process')
        .map((option) => option.process)
        .filter((processId): processId is string => Boolean(processId))
    );

    expect(processIds.size).toBeGreaterThan(0);
    expect([...processIds]).toEqual(
      expect.arrayContaining([
        'prepare-local-testbed',
        'execute-dspace-tests',
        'create-local-test-report',
      ])
    );
  });

  it('keeps report process producing the local test report item', () => {
    const processes = JSON.parse(readFileSync(processPath, 'utf8')) as Process[];
    const reportProcess = processes.find((process) => process.id === 'create-local-test-report');

    expect(reportProcess).toBeDefined();
    expect(reportProcess?.createItems ?? []).toEqual(
      expect.arrayContaining([
        {
          id: '1486e0df-f01e-4c9e-bdd8-ef272df0b9ef',
          count: 1,
        },
      ])
    );
  });
});
