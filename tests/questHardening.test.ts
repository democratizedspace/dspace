import { describe, expect, it } from 'vitest';
import { globSync } from 'glob';
import fs from 'fs';
import hardening from '../common/hardening.js';

const { validateHardening, evaluateQuestQuality } = hardening;

function loadQuest(filePath: string) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, any>;
}

describe('quest hardening metadata', () => {
    const questFiles = globSync('frontend/src/pages/quests/json/**/*.json', {
        ignore: ['**/templates/*.json'],
    });

    it('every quest includes valid hardening data', () => {
        for (const file of questFiles) {
            const quest = loadQuest(file);
            expect(quest.hardening).toBeDefined();
            const errors = validateHardening(quest.hardening);
            expect(errors).toEqual([]);
            expect(quest.hardening.passes).toBe(quest.hardening.history.length);
        }
    });

    it('hardening scores meet or exceed evaluator output', () => {
        for (const file of questFiles) {
            const quest = loadQuest(file);
            const evaluationScore = evaluateQuestQuality(quest);
            expect(quest.hardening.score).toBeGreaterThanOrEqual(evaluationScore);
        }
    });
});
