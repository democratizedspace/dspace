import { describe, expect, it } from 'vitest';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };
import bucketQuest from '../frontend/src/pages/quests/json/hydroponics/bucket_10.json' assert { type: 'json' };

const DECHLORINATED_WATER_ID = '71efa72a-8c87-4dc2-8e2c-9119bb28fe50';
const HYDRO_AWARD_ID = '978ce094-f4fa-4b55-9e1a-2ea76531989d';

describe('hydroponics bucket_10 regressions', () => {
    it('grants Hydro Award as the quest reward', () => {
        expect(bucketQuest.rewards).toContainEqual({ id: HYDRO_AWARD_ID, count: 1 });
    });

    it('stages ten dechlorinated buckets without consuming the water', () => {
        const stageTenBuckets = (processes as Array<any>).find((process) => process.id === 'stage-ten-buckets');

        expect(stageTenBuckets).toBeDefined();
        expect(stageTenBuckets.requireItems).toContainEqual({ id: DECHLORINATED_WATER_ID, count: 10 });
        expect(stageTenBuckets.consumeItems).toEqual([]);
    });
});
