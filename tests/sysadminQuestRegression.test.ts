import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

type Quest = {
    id: string;
    rewards?: Array<{ id: string; count: number }>;
    dialogue: Array<{
        id: string;
        options?: Array<{ type?: string; process?: string }>;
    }>;
};

const questPath = (name: string) =>
    path.join(
        __dirname,
        '..',
        'frontend',
        'src',
        'pages',
        'quests',
        'json',
        'sysadmin',
        `${name}.json`
    );

const readQuest = (name: string): Quest => JSON.parse(fs.readFileSync(questPath(name), 'utf8'));

const quizNodeCount = (quest: Quest) =>
    quest.dialogue.filter((node) => node.id.startsWith('quiz-')).length;

const processOptionCount = (quest: Quest) =>
    quest.dialogue.reduce(
        (count, node) => count + (node.options ?? []).filter((opt) => opt.type === 'process').length,
        0
    );

describe('sysadmin quest regression guards', () => {
    it('basic-commands has rewards, >=2 process steps, and >=5 quiz questions', () => {
        const quest = readQuest('basic-commands');
        expect(quest.rewards?.length ?? 0).toBeGreaterThan(0);
        expect(processOptionCount(quest)).toBeGreaterThanOrEqual(2);
        expect(quizNodeCount(quest)).toBeGreaterThanOrEqual(5);
    });

    it('resource-monitoring has rewards, process steps, and quiz coverage', () => {
        const quest = readQuest('resource-monitoring');
        expect(quest.rewards?.length ?? 0).toBeGreaterThan(0);
        expect(processOptionCount(quest)).toBeGreaterThanOrEqual(2);
        expect(quizNodeCount(quest)).toBeGreaterThanOrEqual(4);
    });

    it('log-analysis has rewards, process steps, and quiz coverage', () => {
        const quest = readQuest('log-analysis');
        expect(quest.rewards?.length ?? 0).toBeGreaterThan(0);
        expect(processOptionCount(quest)).toBeGreaterThanOrEqual(2);
        expect(quizNodeCount(quest)).toBeGreaterThanOrEqual(4);
    });
});
