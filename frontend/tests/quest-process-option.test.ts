import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

type QuestOption = {
    type?: string;
    process?: string;
    requiresItems?: unknown;
};

type QuestDialogueNode = {
    id?: string;
    options?: QuestOption[];
};

type QuestFile = {
    dialogue?: QuestDialogueNode[];
    dialogues?: QuestDialogueNode[];
};

describe('quest process options', () => {
    it('does not allow requiresItems on process dialogue options', () => {
        const questsRoot = path.join(process.cwd(), 'frontend/src/pages/quests/json');
        const violations: string[] = [];

        for (const treeEntry of fs.readdirSync(questsRoot, { withFileTypes: true })) {
            if (!treeEntry.isDirectory()) {
                continue;
            }

            const treePath = path.join(questsRoot, treeEntry.name);

            for (const file of fs.readdirSync(treePath)) {
                if (!file.endsWith('.json')) {
                    continue;
                }

                const filePath = path.join(treePath, file);
                let quest: QuestFile;
                try {
                    quest = JSON.parse(fs.readFileSync(filePath, 'utf8')) as QuestFile;
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    throw new Error(`Failed to parse quest JSON: ${filePath}\n${message}`);
                }
                const dialogue = Array.isArray(quest.dialogue)
                    ? quest.dialogue
                    : Array.isArray(quest.dialogues)
                      ? quest.dialogues
                      : [];

                for (const node of dialogue) {
                    for (const option of node.options ?? []) {
                        if (
                            option.type === 'process' &&
                            Object.prototype.hasOwnProperty.call(option, 'requiresItems')
                        ) {
                            const relativePath = path.relative(process.cwd(), filePath);
                            violations.push(
                                `${relativePath} :: dialogue=${node.id ?? '(unknown)'} :: process=${option.process ?? '(unknown)'}`
                            );
                        }
                    }
                }
            }
        }

        expect(violations).toEqual([]);
    });
});
