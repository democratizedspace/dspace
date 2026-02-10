import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatDialogueIssues, validateQuestDialogueGraph } from './utils/questCompletableValidation';

const loadJson = (relativePath: string) =>
    JSON.parse(readFileSync(path.join(process.cwd(), relativePath), 'utf8'));

describe('quest dialogue graph validation', () => {
    it('flags dead-end fixtures and unreachable finish nodes', () => {
        const quest = loadJson('tests/fixtures/quests/dialogue-dead-end.json');
        const issues = validateQuestDialogueGraph(quest, 'tests/fixtures/quests/dialogue-dead-end.json');

        expect(issues.some((issue) => issue.reason === 'dead-end' && issue.nodeId === 'temp')).toBe(
            true
        );
        expect(issues.some((issue) => issue.reason === 'unreachable-finish')).toBe(true);
    });

    it('passes the composting turn-pile quest temp branch', () => {
        const questPath = 'frontend/src/pages/quests/json/composting/turn-pile.json';
        const quest = loadJson(questPath);
        const issues = validateQuestDialogueGraph(quest, questPath);

        expect(issues, formatDialogueIssues(issues)).toEqual([]);
    });
});
