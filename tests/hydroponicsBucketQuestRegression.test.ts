import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type QuestReward = { id: string; count: number };
type Quest = { rewards?: QuestReward[] };
type ProcessItem = { id: string; count: number };
type Process = { id: string; requireItems?: ProcessItem[]; consumeItems?: ProcessItem[]; createItems?: ProcessItem[] };

const hydroQuestPath = resolve(process.cwd(), 'frontend/src/pages/quests/json/hydroponics/bucket_10.json');
const processesPath = resolve(process.cwd(), 'frontend/src/pages/processes/base.json');

const loadHydroQuest = () => JSON.parse(readFileSync(hydroQuestPath, 'utf8')) as Quest;
const loadProcesses = () => JSON.parse(readFileSync(processesPath, 'utf8')) as Process[];

describe('hydroponics/bucket_10 regression guards', () => {
    it('rewards the Hydro Award item', () => {
        const quest = loadHydroQuest();

        expect(quest.rewards ?? []).toEqual(
            expect.arrayContaining([{ id: '978ce094-f4fa-4b55-9e1a-2ea76531989d', count: 1 }])
        );
    });

    it('keeps ten dechlorinated buckets as a requirement without consuming them', () => {
        const stageTenBuckets = loadProcesses().find((process) => process.id === 'stage-ten-buckets');

        expect(stageTenBuckets).toBeTruthy();
        expect(stageTenBuckets?.requireItems ?? []).toEqual(
            expect.arrayContaining([{ id: '71efa72a-8c87-4dc2-8e2c-9119bb28fe50', count: 10 }])
        );
        expect(stageTenBuckets?.consumeItems ?? []).toEqual([]);
        expect(stageTenBuckets?.createItems ?? []).toEqual(
            expect.arrayContaining([{ id: '86b5d874-a04e-426f-be77-0f7047789faf', count: 1 }])
        );
    });
});
