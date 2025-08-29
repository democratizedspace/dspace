import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test } from 'vitest';
import validateQuest from '../scripts/validate-quest.js';

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
    };
    const file = writeQuestFile(invalidQuest);
    const result = validateQuest(file);
    rmSync(path.dirname(file), { recursive: true, force: true });
    expect(result).toBe(false);
});

