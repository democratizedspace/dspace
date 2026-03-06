import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

type QuestOption = {
  type?: string;
};

type QuestNode = {
  options?: QuestOption[];
};

type QuestFile = {
  id: string;
  title?: string;
  description?: string;
  dialogue?: QuestNode[];
};

const QUESTS_DIR = path.join(
  process.cwd(),
  'frontend',
  'src',
  'pages',
  'quests',
  'json'
);

const BUILD_VERBS =
  /\b(build|install|assemble|construct|make|add|mount|set\s+up)\b/i;
const STRUCTURE_NOUNS =
  /\b(robot|digester|enclosure|mount|gripper|tracker|turbine|reactor|rig|light)\b/i;

const TITLE_EXCEPTIONS = new Set<string>([
  // "Set up" can describe policy/config tasks that are not physical builds.
  'ubi/reminder',
]);

function listQuestFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listQuestFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

function hasProcessOption(quest: QuestFile): boolean {
  return (quest.dialogue ?? []).some((node) =>
    (node.options ?? []).some((option) => option.type === 'process')
  );
}

function isPhysicalBuildQuest(quest: QuestFile): boolean {
  const text = `${quest.title ?? ''} ${quest.description ?? ''}`.trim();
  return BUILD_VERBS.test(text) && STRUCTURE_NOUNS.test(text);
}

describe('quest build immersion process coverage', () => {
  it('requires at least one process for structure/machine build quests', () => {
    const failures: string[] = [];

    for (const filePath of listQuestFiles(QUESTS_DIR)) {
      const quest = JSON.parse(readFileSync(filePath, 'utf8')) as QuestFile;
      if (TITLE_EXCEPTIONS.has(quest.id)) {
        continue;
      }
      if (!isPhysicalBuildQuest(quest)) {
        continue;
      }
      if (hasProcessOption(quest)) {
        continue;
      }
      failures.push(`${quest.id} (${path.relative(process.cwd(), filePath)})`);
    }

    expect(
      failures,
      `Build-like quests missing process options:\n${failures.join('\n')}`
    ).toEqual([]);
  });
});
