import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

describe('composting start quest regression checks', () => {
    const questPath = path.join(__dirname, '../frontend/src/pages/quests/json/composting/start.json');
    const processesPath = path.join(__dirname, '../frontend/src/pages/processes/base.json');

    test('includes explicit process-on-item-page hint text', () => {
        const quest = JSON.parse(fs.readFileSync(questPath, 'utf8'));
        const combinedText = quest.dialogue.map((node: { text: string }) => node.text).join(' ');

        expect(combinedText).toContain('processes live on item pages');
        expect(combinedText).toContain('Process section');
    });

    test('start-compost-bin process consumes organic matter inputs', () => {
        const processes = JSON.parse(fs.readFileSync(processesPath, 'utf8'));
        const startCompostBin = processes.find((process: { id: string }) => process.id === 'start-compost-bin');
        const organicMatterIds = new Set([
            '29190faf-8581-4769-b871-f0ee283840e1', // harvested basil plant
            '5d48cefb-fc1f-4962-b2c6-9b014151d0ae', // bundle of basil leaves
        ]);

        expect(startCompostBin).toBeDefined();
        expect(Array.isArray(startCompostBin.consumeItems)).toBe(true);
        expect(startCompostBin.consumeItems.length).toBeGreaterThan(0);
        expect(startCompostBin.consumeItems.some((item: { id: string }) => organicMatterIds.has(item.id))).toBe(
            true
        );
    });

    test('quest has rewards and a composting quiz sequence', () => {
        const quest = JSON.parse(fs.readFileSync(questPath, 'utf8'));
        const dialogueIds = quest.dialogue.map((node: { id: string }) => node.id);

        expect(Array.isArray(quest.rewards)).toBe(true);
        expect(quest.rewards.length).toBeGreaterThan(0);
        expect(dialogueIds).toEqual(expect.arrayContaining(['quiz-1', 'quiz-6', 'quiz-retry']));
    });
});
