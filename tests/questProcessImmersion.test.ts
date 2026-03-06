import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadQuests } from '../scripts/gen-quest-tree.mjs';

type QuestOption = {
  type?: string;
};

type QuestNode = {
  text?: string;
  options?: QuestOption[];
};

type Quest = {
  id?: string;
  title?: string;
  description?: string;
  dialogue?: QuestNode[];
};

const EXCEPTION_QUEST_IDS = new Set([
  // Currency milestone quests are intentionally process-agnostic progress checks.
  'energy/dWatt-1e3',
  'energy/dWatt-1e4',
  'energy/dWatt-1e5',
  'energy/dWatt-1e6',
  'energy/dWatt-1e7',
  'energy/dWatt-1e8',
  'energy/dSolar-1kW',
  'energy/dSolar-10kW',
  'energy/dSolar-100kW',
]);

const PROCESS_EXPECTED_PATTERN =
  /\b(build|install|assemble|construct|set up|setup|mount|enclosure|rig)\b/i;

const hasProcessOption = (quest: Quest) =>
  (quest.dialogue ?? []).some((node) =>
    (node.options ?? []).some((option) => option.type === 'process')
  );

describe('Quest process immersion quality bar', () => {
  it('requires build/install-style quests to include at least one process option', async () => {
    const quests = (await loadQuests()) as Quest[];

    const violations = quests
      .filter((quest) => {
        if (!quest.id || EXCEPTION_QUEST_IDS.has(quest.id)) return false;

        const searchableText = [quest.title ?? '', quest.description ?? ''].join(' ');

        if (!PROCESS_EXPECTED_PATTERN.test(searchableText)) return false;
        return !hasProcessOption(quest);
      })
      .map((quest) => quest.id ?? 'unknown-id')
      .sort();

    expect(violations).toEqual([]);
  });

  it('keeps energy/biogas-digester anchored to a real-time build process', async () => {
    const quests = (await loadQuests()) as Quest[];
    const biogasQuest = quests.find((quest) => quest.id === 'energy/biogas-digester');

    expect(biogasQuest).toBeDefined();

    const processOptions = (biogasQuest?.dialogue ?? [])
      .flatMap((node) => node.options ?? [])
      .filter((option) => option.type === 'process');

    expect(processOptions.length).toBeGreaterThan(0);

    const processCatalogPath = 'frontend/src/pages/processes/base.json';
    const processCatalog = JSON.parse(readFileSync(processCatalogPath, 'utf8')) as Array<{
      id?: string;
      duration?: string;
    }>;

    const biogasBuildProcess = processCatalog.find(
      (process) => process.id === 'build-biogas-digester-20l'
    );

    expect(biogasBuildProcess).toBeDefined();
    expect(biogasBuildProcess?.duration).toBe('6h');
  });
});
