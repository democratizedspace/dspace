import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadQuests } from '../scripts/gen-quest-tree.mjs';
import { validateQuestDialogueFlow } from '../scripts/validate-quest-completion.mjs';

describe('quest dialogue completable validation', () => {
    it('fails for reachable dead-end nodes', () => {
        const quest = {
            id: 'fixture/dead-end',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Welcome',
                    options: [{ type: 'goto', goto: 'temp', text: 'Continue' }],
                },
                {
                    id: 'temp',
                    text: 'Oops no way out',
                    options: [{ type: 'grantsItems', text: 'Take note' }],
                },
                {
                    id: 'finish',
                    text: 'Done',
                    options: [{ type: 'finish', text: 'Finish' }],
                },
            ],
        };

        const failures = validateQuestDialogueFlow(quest);
        expect(failures.some((failure) => failure.nodeId === 'temp')).toBe(true);
        expect(
            failures.some((failure) =>
                failure.reason.includes('cannot reach any terminal/finish outcome')
            )
        ).toBe(true);
    });

    it('passes composting/turn-pile regression', async () => {
        const questPath = path.join(
            process.cwd(),
            'frontend/src/pages/quests/json/composting/turn-pile.json'
        );
        const quest = JSON.parse(await readFile(questPath, 'utf8'));

        expect(validateQuestDialogueFlow(quest)).toEqual([]);
    });

    it('validates all built-in quests have a route to finish', async () => {
        const quests = await loadQuests();
        const failures = quests.flatMap((quest) => validateQuestDialogueFlow(quest));
        const report = failures.map(
            (failure) =>
                `${failure.questId} :: ${failure.nodeId} :: ${failure.reason} :: ${failure.node.text}`
        );

        expect(report).toEqual([]);
    });
});
