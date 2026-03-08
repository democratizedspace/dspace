import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const QUEST_JSON_ROOT = path.join(process.cwd(), 'frontend', 'src', 'pages', 'quests', 'json');

function getQuestFiles(): string[] {
    const questFiles: string[] = [];
    const trees = fs.readdirSync(QUEST_JSON_ROOT, { withFileTypes: true });

    for (const tree of trees) {
        if (!tree.isDirectory()) {
            continue;
        }

        const treePath = path.join(QUEST_JSON_ROOT, tree.name);
        const files = fs.readdirSync(treePath, { withFileTypes: true });

        for (const file of files) {
            if (file.isFile() && file.name.endsWith('.json')) {
                questFiles.push(path.join(treePath, file.name));
            }
        }
    }

    return questFiles;
}

describe('quest process options', () => {
    it('does not allow requiresItems on process options', () => {
        const violations: string[] = [];

        for (const filePath of getQuestFiles()) {
            const raw = fs.readFileSync(filePath, 'utf8');
            let quest: {
                dialogue?: Array<{ id?: string; options?: Array<Record<string, unknown>> }>;
                dialogues?: Array<{ id?: string; options?: Array<Record<string, unknown>> }>;
            };

            try {
                quest = JSON.parse(raw);
            } catch (error) {
                throw new Error(`Failed to parse quest JSON: ${filePath}`, {
                    cause: error,
                });
            }

            const dialogues = quest.dialogue ?? quest.dialogues ?? [];

            for (const dialogue of dialogues) {
                const options = dialogue.options ?? [];

                for (const option of options) {
                    if (
                        option &&
                        option.type === 'process' &&
                        Object.prototype.hasOwnProperty.call(option, 'requiresItems')
                    ) {
                        violations.push(
                            `${filePath} -> dialogue "${dialogue.id ?? 'unknown'}" option "${option.process ?? option.text ?? 'unknown'}"`
                        );
                    }
                }
            }
        }

        expect(violations).toEqual([]);
    });
});
