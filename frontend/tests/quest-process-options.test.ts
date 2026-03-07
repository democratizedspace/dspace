import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';

describe('quest process dialogue options', () => {
    it('do not declare requiresItems on process options', () => {
        const questFiles = globSync('frontend/src/pages/quests/json/**/*.json');
        const violations: string[] = [];

        for (const questFile of questFiles) {
            const quest = JSON.parse(fs.readFileSync(questFile, 'utf8'));

            for (const node of quest.dialogue ?? []) {
                for (const option of node.options ?? []) {
                    if (option?.type === 'process' && Object.hasOwn(option, 'requiresItems')) {
                        const relativeFile = path.relative(process.cwd(), questFile);
                        violations.push(`${relativeFile} :: dialogue:${node.id} :: text:${option.text}`);
                    }
                }
            }
        }

        expect(violations).toEqual([]);
    });
});
