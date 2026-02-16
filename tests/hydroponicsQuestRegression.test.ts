import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type Reward = { id: string; count: number };

type QuestDefinition = {
  rewards?: Reward[];
};

type ProcessDefinition = {
  id: string;
  requireItems?: Reward[];
  consumeItems?: Reward[];
  createItems?: Reward[];
};

const repoRoot = path.resolve(__dirname, '..');
const hydroAwardId = '978ce094-f4fa-4b55-9e1a-2ea76531989d';
const dechlorinatedBucketId = '71efa72a-8c87-4dc2-8e2c-9119bb28fe50';

function readJson<T>(relativePath: string): T {
  const filePath = path.join(repoRoot, relativePath);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

describe('hydroponics bucket_10 regressions', () => {
  it('hydroponics/bucket_10 rewards the Hydro Award item', () => {
    const quest = readJson<QuestDefinition>('frontend/src/pages/quests/json/hydroponics/bucket_10.json');

    expect(quest.rewards).toEqual([{ id: hydroAwardId, count: 1 }]);
  });

  it('stage-ten-buckets requires ten dechlorinated buckets but does not consume them', () => {
    const processes = readJson<ProcessDefinition[]>('frontend/src/pages/processes/base.json');
    const stageProcess = processes.find((process) => process.id === 'stage-ten-buckets');

    expect(stageProcess).toBeDefined();
    expect(stageProcess?.requireItems).toContainEqual({ id: dechlorinatedBucketId, count: 10 });
    expect(stageProcess?.consumeItems ?? []).not.toContainEqual({
      id: dechlorinatedBucketId,
      count: 10,
    });
  });
});
