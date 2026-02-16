import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const HYDRO_AWARD_ID = '978ce094-f4fa-4b55-9e1a-2ea76531989d';
const COMPOST_BUCKET_ID = 'b281360b-2ecc-4fea-a248-36a61c5f7399';
const DECHLORINATED_WATER_ID = '71efa72a-8c87-4dc2-8e2c-9119bb28fe50';

const bucketQuestPath = path.join(
    __dirname,
    '../frontend/src/pages/quests/json/hydroponics/bucket_10.json'
);
const processesPath = path.join(__dirname, '../frontend/src/generated/processes.json');

describe('hydroponics bucket_10 regression', () => {
    it('rewards the Hydro Award instead of cured compost bucket', () => {
        const quest = JSON.parse(readFileSync(bucketQuestPath, 'utf8'));
        const rewardIds = (quest.rewards ?? []).map((reward: { id: string }) => reward.id);

        expect(rewardIds).toContain(HYDRO_AWARD_ID);
        expect(rewardIds).not.toContain(COMPOST_BUCKET_ID);
    });

    it('requires ten dechlorinated water buckets without consuming them', () => {
        const processes = JSON.parse(readFileSync(processesPath, 'utf8')) as Array<{
            id: string;
            requireItems: Array<{ id: string; count: number }>;
            consumeItems: Array<{ id: string; count: number }>;
        }>;

        const stageTenBuckets = processes.find((process) => process.id === 'stage-ten-buckets');

        expect(stageTenBuckets).toBeDefined();
        expect(stageTenBuckets?.requireItems).toContainEqual({
            id: DECHLORINATED_WATER_ID,
            count: 10,
        });
        expect(stageTenBuckets?.consumeItems ?? []).not.toContainEqual({
            id: DECHLORINATED_WATER_ID,
            count: 10,
        });
    });
});
