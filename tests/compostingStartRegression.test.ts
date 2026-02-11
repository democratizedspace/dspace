import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type ItemCount = {
    id: string;
    count: number;
};

type ProcessLike = {
    id: string;
    consumeItems?: ItemCount[];
};

type DialogueOption = {
    text?: string;
};

type DialogueNode = {
    text?: string;
    options?: DialogueOption[];
};

type QuestLike = {
    rewards?: ItemCount[];
    dialogue?: DialogueNode[];
};

const questPath = join(__dirname, '../frontend/src/pages/quests/json/composting/start.json');
const processesPath = join(__dirname, '../frontend/src/pages/processes/base.json');

const quest: QuestLike = JSON.parse(readFileSync(questPath, 'utf8'));
const processes: ProcessLike[] = JSON.parse(readFileSync(processesPath, 'utf8'));

const questText = (quest.dialogue ?? [])
    .flatMap((node) => [node.text ?? '', ...(node.options ?? []).map((option) => option.text ?? '')])
    .join(' ')
    .toLowerCase();

describe('composting start quest regressions', () => {
    it('includes explicit hinting that processes live on item pages', () => {
        expect(questText).toContain('processes live on item pages');
        expect(questText).toContain('process section');
    });

    it('keeps start-compost-bin process grounded in organic matter inputs', () => {
        const startCompost = processes.find((process) => process.id === 'start-compost-bin');
        expect(startCompost).toBeDefined();

        const consumeIds = new Set((startCompost?.consumeItems ?? []).map((item) => item.id));
        expect(consumeIds.size).toBeGreaterThan(0);
        expect(consumeIds.has('5d48cefb-fc1f-4962-b2c6-9b014151d0ae')).toBe(true);
    });

    it('has completion rewards and a composting quiz flow', () => {
        expect((quest.rewards ?? []).length).toBeGreaterThan(0);
        expect(questText).toContain('quiz 1');
        expect(questText).toContain('quiz 5');
    });
});
