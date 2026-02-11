import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

type DialogueNode = {
    id: string;
    text: string;
};

type Reward = {
    id: string;
    count: number;
};

type Quest = {
    dialogue: DialogueNode[];
    rewards: Reward[];
};

type ProcessItem = {
    id: string;
    count: number;
};

type ProcessEntry = {
    id: string;
    consumeItems: ProcessItem[];
};

const repoRoot = path.resolve(import.meta.dirname, '..');
const compostStartPath = path.join(repoRoot, 'src/pages/quests/json/composting/start.json');
const processesPath = path.join(repoRoot, 'src/pages/processes/base.json');

function readJson<T>(filePath: string): T {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

describe('composting content regression checks', () => {
    it('includes explicit process-on-item-page UX hints and quiz content', () => {
        const quest = readJson<Quest>(compostStartPath);
        const dialogueText = quest.dialogue.map((node) => node.text).join(' ');
        const hasItemPageHint = dialogueText.toLowerCase().includes('processes live on item pages');
        const quizNodes = quest.dialogue.filter((node) => node.id.startsWith('quiz-'));

        expect(hasItemPageHint).toBe(true);
        expect(quizNodes.length).toBeGreaterThan(0);
        expect(quest.rewards.length).toBeGreaterThan(0);
    });

    it('requires organic matter in start-compost-bin consumeItems', () => {
        const processes = readJson<ProcessEntry[]>(processesPath);
        const compostProcess = processes.find((entry) => entry.id === 'start-compost-bin');

        expect(compostProcess).toBeTruthy();
        expect(compostProcess?.consumeItems.length ?? 0).toBeGreaterThan(0);

        const organicMatterIds = new Set([
            '5d48cefb-fc1f-4962-b2c6-9b014151d0ae',
            '29190faf-8581-4769-b871-f0ee283840e1',
        ]);
        const hasOrganicMatter =
            compostProcess?.consumeItems.some((item) => organicMatterIds.has(item.id)) ?? false;

        expect(hasOrganicMatter).toBe(true);
    });
});
