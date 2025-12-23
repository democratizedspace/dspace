import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import {
    computeEmoji,
    evaluateQuestQuality,
    validateHardening,
} from '../scripts/hardening/utils.mjs';

const questSchema = JSON.parse(
    readFileSync(path.join(__dirname, '../frontend/src/pages/quests/jsonSchemas/quest.json'), 'utf8')
);
const hardeningSchema = JSON.parse(
    readFileSync(path.join(__dirname, '../frontend/src/pages/shared/hardening.schema.json'), 'utf8')
);

function loadQuests(dir: string) {
    const quests: any[] = [];
    for (const entry of readdirSync(dir)) {
        const fullPath = path.join(dir, entry);
        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
            quests.push(...loadQuests(fullPath));
            continue;
        }
        if (!entry.endsWith('.json')) continue;
        quests.push(JSON.parse(readFileSync(fullPath, 'utf8')));
    }
    return quests;
}

describe('quest hardening', () => {
    const ajv = new Ajv({ allErrors: true });
    ajv.addSchema(hardeningSchema);
    const validateQuest = ajv.compile(questSchema);

    it('enforces hardening data across all quests', () => {
        const quests = loadQuests(path.join(__dirname, '../frontend/src/pages/quests/json'));
        expect(quests.length).toBeGreaterThan(0);
        for (const quest of quests) {
            const valid = validateQuest(quest);
            if (!valid) {
                console.error(validateQuest.errors);
            }
            expect(valid).toBe(true);
            const issues = validateHardening(quest.hardening);
            expect(issues).toEqual([]);
            const baseline = evaluateQuestQuality(quest);
            expect(quest.hardening.score).toBeGreaterThanOrEqual(baseline);
            expect(quest.hardening.emoji).toBe(
                computeEmoji(quest.hardening.passes, quest.hardening.score)
            );
        }
    });
});
