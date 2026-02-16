import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HYDRO_AWARD_ID = '978ce094-f4fa-4b55-9e1a-2ea76531989d';
const COMPOST_BUCKET_ID = 'b281360b-2ecc-4fea-a248-36a61c5f7399';
const DECHLORINATED_WATER_ID = '71efa72a-8c87-4dc2-8e2c-9119bb28fe50';

const fixturesDir = path.dirname(fileURLToPath(import.meta.url));
const bucketQuestPath = path.join(fixturesDir, '../frontend/src/pages/quests/json/hydroponics/bucket_10.json');
const generatedProcessesPath = path.join(fixturesDir, '../frontend/src/generated/processes.json');
const sourceProcessesPath = path.join(fixturesDir, '../frontend/src/pages/processes/base.json');

type ProcessDef = {
    id: string;
    requireItems: Array<{ id: string; count: number }>;
    consumeItems: Array<{ id: string; count: number }>;
};

function getStageTenBucketsProcess(processesPath: string): ProcessDef | undefined {
    const processes = JSON.parse(readFileSync(processesPath, 'utf8')) as ProcessDef[];
    return processes.find((process) => process.id === 'stage-ten-buckets');
}

describe('hydroponics bucket_10 regression', () => {
    it('rewards the Hydro Award instead of cured compost bucket', () => {
        const quest = JSON.parse(readFileSync(bucketQuestPath, 'utf8'));
        const rewardIds = (quest.rewards ?? []).map((reward: { id: string }) => reward.id);

        expect(rewardIds).toContain(HYDRO_AWARD_ID);
        expect(rewardIds).not.toContain(COMPOST_BUCKET_ID);
    });

    it('requires ten dechlorinated water buckets without consuming them in generated processes', () => {
        const stageTenBuckets = getStageTenBucketsProcess(generatedProcessesPath);

        expect(stageTenBuckets).toBeDefined();
        expect(stageTenBuckets?.requireItems).toContainEqual({
            id: DECHLORINATED_WATER_ID,
            count: 10,
        });
        const consumeItems = stageTenBuckets?.consumeItems ?? [];
        expect(consumeItems.some((item) => item.id === DECHLORINATED_WATER_ID)).toBe(false);
    });

    it('keeps source and generated stage-ten-buckets consumeItems empty', () => {
        const sourceStageTenBuckets = getStageTenBucketsProcess(sourceProcessesPath);
        const generatedStageTenBuckets = getStageTenBucketsProcess(generatedProcessesPath);

        expect(sourceStageTenBuckets).toBeDefined();
        expect(generatedStageTenBuckets).toBeDefined();
        expect(sourceStageTenBuckets?.consumeItems ?? []).toEqual([]);
        expect(generatedStageTenBuckets?.consumeItems ?? []).toEqual([]);
    });
});
