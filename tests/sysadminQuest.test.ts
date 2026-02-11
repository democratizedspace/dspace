import fs from 'fs';
import path from 'path';

type Quest = {
  id: string;
  rewards?: Array<{ id: string; count: number }>;
  dialogue?: Array<{
    id?: string;
    text?: string;
    options?: Array<{ type?: string; process?: string; goto?: string }>;
  }>;
};

const loadQuest = (relativePath: string): Quest => {
  const file = path.join(__dirname, '..', relativePath);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

const sysadminQuestPaths = [
  'frontend/src/pages/quests/json/sysadmin/basic-commands.json',
  'frontend/src/pages/quests/json/sysadmin/resource-monitoring.json',
  'frontend/src/pages/quests/json/sysadmin/log-analysis.json',
] as const;

const countQuizQuestions = (quest: Quest) =>
  (quest.dialogue ?? []).filter((node) => node.id?.startsWith('quiz-')).length;

const getProcessOptions = (quest: Quest) =>
  (quest.dialogue ?? []).flatMap((node) =>
    (node.options ?? []).filter((option) => option.type === 'process' && option.process)
  );

describe('sysadmin quest tree', () => {
  it('includes the basic commands quest', () => {
    const quest = loadQuest('frontend/src/pages/quests/json/sysadmin/basic-commands.json');
    expect(quest.id).toBe('sysadmin/basic-commands');
  });

  it('ensures upgraded sysadmin quests provide rewards and process steps', () => {
    for (const questPath of sysadminQuestPaths) {
      const quest = loadQuest(questPath);
      expect(quest.rewards?.length ?? 0).toBeGreaterThan(0);
      expect(getProcessOptions(quest).length).toBeGreaterThan(0);
    }
  });

  it('requires quiz content in upgraded sysadmin quests and at least 5 for basic commands', () => {
    const basicCommandsQuest = loadQuest('frontend/src/pages/quests/json/sysadmin/basic-commands.json');
    expect(countQuizQuestions(basicCommandsQuest)).toBeGreaterThanOrEqual(5);

    for (const questPath of sysadminQuestPaths) {
      const quest = loadQuest(questPath);
      expect(countQuizQuestions(quest)).toBeGreaterThan(0);
    }
  });
});
