import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type QuestOption = {
  type: string;
  process?: string;
};

type QuestDialogueNode = {
  id: string;
  options?: QuestOption[];
};

type QuestDefinition = {
  rewards?: Array<{ id: string; count: number }>;
  dialogue?: QuestDialogueNode[];
};

const repoRoot = path.resolve(__dirname, '..');

function loadQuest(relativePath: string): QuestDefinition {
  const questPath = path.join(repoRoot, relativePath);
  return JSON.parse(fs.readFileSync(questPath, 'utf8')) as QuestDefinition;
}

function countQuizQuestions(quest: QuestDefinition): number {
  return (quest.dialogue ?? []).filter((node) => node.id.startsWith('quiz-')).length;
}

function countProcessOptions(quest: QuestDefinition): number {
  return (quest.dialogue ?? []).flatMap((node) => node.options ?? []).filter((o) => o.type === 'process')
    .length;
}

describe('sysadmin quest quality baseline', () => {
  it('basic-commands has rewards, 2+ processes, and at least 5 quiz questions', () => {
    const quest = loadQuest('frontend/src/pages/quests/json/sysadmin/basic-commands.json');

    expect(quest.rewards?.length ?? 0).toBeGreaterThan(0);
    expect(countProcessOptions(quest)).toBeGreaterThanOrEqual(2);
    expect(countQuizQuestions(quest)).toBeGreaterThanOrEqual(5);
  });

  it('resource-monitoring has rewards, processes, and quiz coverage', () => {
    const quest = loadQuest('frontend/src/pages/quests/json/sysadmin/resource-monitoring.json');

    expect(quest.rewards?.length ?? 0).toBeGreaterThan(0);
    expect(countProcessOptions(quest)).toBeGreaterThanOrEqual(2);
    expect(countQuizQuestions(quest)).toBeGreaterThanOrEqual(5);
  });

  it('log-analysis has rewards, processes, and quiz coverage', () => {
    const quest = loadQuest('frontend/src/pages/quests/json/sysadmin/log-analysis.json');

    expect(quest.rewards?.length ?? 0).toBeGreaterThan(0);
    expect(countProcessOptions(quest)).toBeGreaterThanOrEqual(2);
    expect(countQuizQuestions(quest)).toBeGreaterThanOrEqual(5);
  });
});
