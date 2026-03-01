import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test } from 'vitest';
import validateQuest from '../scripts/validate-quest.js';

const defaultHardening = {
    passes: 0,
    score: 0,
    emoji: '🛠️',
    history: [],
};

function writeQuestFile(data: object): string {
    const dir = mkdtempSync(path.join(tmpdir(), 'quest-'));
    const file = path.join(dir, 'quest.json');
    writeFileSync(file, JSON.stringify(data));
    return file;
}

test('returns true for valid quest json', () => {
    const validQuest = {
        id: 'q1',
        title: 'Test',
        description: 'desc',
        image: 'img.png',
        npc: 'npc',
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'hello',
                options: [{ type: 'finish', text: 'done' }],
            },
        ],
        hardening: defaultHardening,
    };
    const file = writeQuestFile(validQuest);
    const result = validateQuest(file);
    rmSync(path.dirname(file), { recursive: true, force: true });
    expect(result).toBe(true);
});

test('returns false for invalid quest json', () => {
    const invalidQuest = {
        title: 'Test',
        description: 'desc',
        image: 'img.png',
        npc: 'npc',
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'hello',
                options: [{ type: 'finish', text: 'done' }],
            },
        ],
        hardening: defaultHardening,
    };
    const file = writeQuestFile(invalidQuest);
    const result = validateQuest(file);
    rmSync(path.dirname(file), { recursive: true, force: true });
    expect(result).toBe(false);
});

test('fails when quest depends on an unknown quest id', () => {
    const questWithMissingDep = {
        id: 'q-missing-dep',
        title: 'Needs Review',
        description: 'desc',
        image: 'img.png',
        npc: 'npc',
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'hello',
                options: [{ type: 'finish', text: 'done' }],
            },
        ],
        requiresQuests: ['quests/unknown'],
        hardening: defaultHardening,
    };
    const file = writeQuestFile(questWithMissingDep);
    const result = validateQuest(file, { knownQuestIds: new Set(['quests/existing']) });
    rmSync(path.dirname(file), { recursive: true, force: true });
    expect(result).toBe(false);
});

test('passes when dependencies exist in the known quest set', () => {
    const questWithValidDeps = {
        id: 'q-valid-dep',
        title: 'Needs Review',
        description: 'desc',
        image: 'img.png',
        npc: 'npc',
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'hello',
                options: [{ type: 'finish', text: 'done' }],
            },
        ],
        requiresQuests: ['quests/existing'],
        hardening: defaultHardening,
    };
    const file = writeQuestFile(questWithValidDeps);
    const result = validateQuest(file, { knownQuestIds: new Set(['quests/existing']) });
    rmSync(path.dirname(file), { recursive: true, force: true });
    expect(result).toBe(true);
});

test('fails when a process option references an unknown process id', () => {
    const questWithMissingProcess = {
        id: 'q-missing-proc',
        title: 'Needs Process',
        description: 'desc',
        image: 'img.png',
        npc: 'npc',
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'hello',
                options: [
                    { type: 'process', process: 'non-existent-process', text: 'run it' },
                    { type: 'finish', text: 'done' },
                ],
            },
        ],
        hardening: defaultHardening,
    };
    const file = writeQuestFile(questWithMissingProcess);
    const result = validateQuest(file, { knownProcessIds: new Set(['existing-process']) });
    rmSync(path.dirname(file), { recursive: true, force: true });
    expect(result).toBe(false);
});

test('passes when all process references exist in the known process set', () => {
    const questWithValidProcess = {
        id: 'q-valid-proc',
        title: 'Has Process',
        description: 'desc',
        image: 'img.png',
        npc: 'npc',
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'hello',
                options: [
                    { type: 'process', process: 'existing-process', text: 'run it' },
                    { type: 'finish', text: 'done' },
                ],
            },
        ],
        hardening: defaultHardening,
    };
    const file = writeQuestFile(questWithValidProcess);
    const result = validateQuest(file, { knownProcessIds: new Set(['existing-process']) });
    rmSync(path.dirname(file), { recursive: true, force: true });
    expect(result).toBe(true);
});

test('fails when an option requires an unknown item id', () => {
    const questWithMissingRequiredItem = {
        id: 'q-missing-required-item',
        title: 'Missing Item Requirement',
        description: 'desc',
        image: 'img.png',
        npc: 'npc',
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'hello',
                options: [
                    {
                        type: 'goto',
                        goto: 'finish-node',
                        text: 'continue',
                        requiresItems: [{ id: 'missing-item', count: 1 }],
                    },
                ],
            },
            {
                id: 'finish-node',
                text: 'done',
                options: [{ type: 'finish', text: 'done' }],
            },
        ],
        hardening: defaultHardening,
    };
    const file = writeQuestFile(questWithMissingRequiredItem);
    const result = validateQuest(file, { knownItemIds: new Set(['existing-item']) });
    rmSync(path.dirname(file), { recursive: true, force: true });
    expect(result).toBe(false);
});

test('fails when an option grants an unknown item id', () => {
    const questWithMissingGrantedItem = {
        id: 'q-missing-granted-item',
        title: 'Missing Granted Item',
        description: 'desc',
        image: 'img.png',
        npc: 'npc',
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'hello',
                options: [
                    {
                        type: 'grantsItems',
                        text: 'grant item',
                        grantsItems: [{ id: 'missing-grant', count: 1 }],
                    },
                    { type: 'finish', text: 'done' },
                ],
            },
        ],
        hardening: defaultHardening,
    };
    const file = writeQuestFile(questWithMissingGrantedItem);
    const result = validateQuest(file, { knownItemIds: new Set(['existing-item']) });
    rmSync(path.dirname(file), { recursive: true, force: true });
    expect(result).toBe(false);
});

test('fails when rewards reference an unknown item id', () => {
    const questWithMissingReward = {
        id: 'q-missing-reward-item',
        title: 'Missing Reward Item',
        description: 'desc',
        image: 'img.png',
        npc: 'npc',
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'hello',
                options: [{ type: 'finish', text: 'done' }],
            },
        ],
        rewards: [{ id: 'missing-reward', count: 1 }],
        hardening: defaultHardening,
    };
    const file = writeQuestFile(questWithMissingReward);
    const result = validateQuest(file, { knownItemIds: new Set(['existing-item']) });
    rmSync(path.dirname(file), { recursive: true, force: true });
    expect(result).toBe(false);
});

test('passes when required, granted, and reward item references are valid', () => {
    const questWithValidItems = {
        id: 'q-valid-items',
        title: 'Valid Item References',
        description: 'desc',
        image: 'img.png',
        npc: 'npc',
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'hello',
                options: [
                    {
                        type: 'grantsItems',
                        text: 'grant',
                        grantsItems: [{ id: 'granted-item', count: 1 }],
                    },
                    {
                        type: 'goto',
                        goto: 'finish-node',
                        text: 'continue',
                        requiresItems: [{ id: 'required-item', count: 1 }],
                    },
                ],
            },
            {
                id: 'finish-node',
                text: 'done',
                options: [{ type: 'finish', text: 'done' }],
            },
        ],
        rewards: [{ id: 'reward-item', count: 1 }],
        hardening: defaultHardening,
    };
    const file = writeQuestFile(questWithValidItems);
    const result = validateQuest(file, {
        knownItemIds: new Set(['required-item', 'granted-item', 'reward-item']),
    });
    rmSync(path.dirname(file), { recursive: true, force: true });
    expect(result).toBe(true);
});
