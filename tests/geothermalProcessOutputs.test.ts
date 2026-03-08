import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };

type ProcessDef = {
    id: string;
    createItems?: Array<{ id: string; count: number }>;
    itemCountOperations?: Array<{ operation?: string }>;
};

type QuestDef = {
    dialogue?: Array<{
        options?: Array<{
            type?: string;
            process?: string;
        }>;
    }>;
};

const geothermalQuestDir = join(
    process.cwd(),
    'frontend/src/pages/quests/json/geothermal'
);

const geothermalProcessIds = new Set<string>();
for (const file of readdirSync(geothermalQuestDir)) {
    if (!file.endsWith('.json')) {
        continue;
    }

    const quest = JSON.parse(
        readFileSync(join(geothermalQuestDir, file), 'utf8')
    ) as QuestDef;

    for (const node of quest.dialogue ?? []) {
        for (const option of node.options ?? []) {
            if (option.type === 'process' && option.process) {
                geothermalProcessIds.add(option.process);
            }
        }
    }
}

const processById = new Map(
    (processes as ProcessDef[]).map((processDef) => [processDef.id, processDef])
);

const hasTangibleCreatedItem = (processDef: ProcessDef) => {
    const staticCreates = (processDef.createItems ?? []).some((item) => item.count > 0);
    const runtimeCreates = (processDef.itemCountOperations ?? []).some((operation) =>
        String(operation.operation ?? '').startsWith('withdraw')
    );
    return staticCreates || runtimeCreates;
};

describe('geothermal process tangible outputs', () => {
    it('requires every geothermal quest process to create at least one tangible item', () => {
        for (const processId of geothermalProcessIds) {
            const processDef = processById.get(processId);
            expect(processDef, `Missing process definition for ${processId}`).toBeDefined();
            expect(
                hasTangibleCreatedItem(processDef as ProcessDef),
                `${processId} must create a tangible item`
            ).toBe(true);
        }
    });
});
