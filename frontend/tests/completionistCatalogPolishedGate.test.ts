import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const POLISHED_AWARD_ID = '1030a6c5-88b9-46e9-b38a-b20d8d326764';

function resolveRepoPath(...parts: string[]) {
    const cwd = process.cwd();
    const asFrontendWorkspace = path.join(cwd, ...parts);
    if (fs.existsSync(asFrontendWorkspace)) {
        return asFrontendWorkspace;
    }

    return path.join(cwd, 'frontend', ...parts);
}

function readJson(...parts: string[]) {
    const filePath = resolveRepoPath(...parts);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

describe('completionist catalog polished gate', () => {
    it('gates catalog quest progression with polished award', () => {
        const quest = readJson('src', 'pages', 'quests', 'json', 'completionist', 'catalog.json');
        const startDialogue = quest.dialogue.find((step: { id: string }) => step.id === 'start');
        const prepDialogue = quest.dialogue.find((step: { id: string }) => step.id === 'prep');

        const startOption = startDialogue.options.find(
            (option: { goto: string }) => option.goto === 'prep'
        );
        const prepOption = prepDialogue.options.find(
            (option: { goto: string }) => option.goto === 'review'
        );

        expect(startOption.requiresItems).toEqual([{ id: POLISHED_AWARD_ID, count: 1 }]);
        expect(prepOption.requiresItems).toContainEqual({ id: POLISHED_AWARD_ID, count: 1 });
    });

    it('requires polished award for the catalog log-entry process', () => {
        const processes = readJson('src', 'pages', 'processes', 'base.json');
        const recordProcess = processes.find(
            (process: { id: string }) => process.id === 'record-completionist-award-entry'
        );

        expect(recordProcess.requireItems).toContainEqual({ id: POLISHED_AWARD_ID, count: 1 });
    });
});
