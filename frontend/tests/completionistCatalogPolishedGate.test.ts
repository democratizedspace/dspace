import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type ItemRef = { id: string; count: number };
type QuestOption = { text?: string; requiresItems?: ItemRef[] };
type QuestStep = { id: string; options?: QuestOption[] };
type Quest = { dialogue?: QuestStep[] };
type Process = { id: string; requireItems?: ItemRef[] };

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const POLISHED_AWARD_ID = '1030a6c5-88b9-46e9-b38a-b20d8d326764';

const readCatalogQuest = (): Quest => {
    const path = join(TEST_DIR, '../src/pages/quests/json/completionist/catalog.json');
    return JSON.parse(readFileSync(path, 'utf8')) as Quest;
};

const readProcesses = (): Process[] => {
    const path = join(TEST_DIR, '../src/pages/processes/base.json');
    return JSON.parse(readFileSync(path, 'utf8')) as Process[];
};

describe('completionist catalog polished award gating', () => {
    it('requires the polished award on catalog dialogue gates', () => {
        const quest = readCatalogQuest();
        const gatedOptionTexts = new Set([
            "Yeah, let's catalog it",
            'I have an entry ready for review',
        ]);

        const targetOptions = (quest.dialogue ?? [])
            .flatMap((step) => step.options ?? [])
            .filter((option) => gatedOptionTexts.has(option.text ?? ''));

        expect(targetOptions.length).toBe(2);

        for (const option of targetOptions) {
            expect(option.requiresItems?.some((item) => item.id === POLISHED_AWARD_ID)).toBe(true);
        }
    });

    it('requires the polished award for the catalog logging process', () => {
        const recordProcess = readProcesses().find(
            (process) => process.id === 'record-completionist-award-entry'
        );

        expect(recordProcess).toBeDefined();
        expect(recordProcess?.requireItems?.some((item) => item.id === POLISHED_AWARD_ID)).toBe(true);
    });
});
