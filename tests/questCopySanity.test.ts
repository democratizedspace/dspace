import { readFileSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';

describe('quest copy sanity', () => {
    it('contains no placeholder text or unfinished markers', () => {
        const questDir = path.join(__dirname, '../frontend/src/pages/quests/json');
        const questFiles = globSync(path.join(questDir, '**/*.json')).sort();
        const placeholderPatterns = [
            /\bTODO\b/i,
            /\bTBD\b/i,
            /\bFIXME\b/i,
            /PLACEHOLDER/i,
            /Lorem ipsum/i,
        ];
        const failures = [];

        for (const file of questFiles) {
            const content = readFileSync(file, 'utf8');
            for (const pattern of placeholderPatterns) {
                if (pattern.test(content)) {
                    failures.push(`${path.relative(questDir, file)} matched ${pattern}`);
                }
            }
        }

        expect(
            failures,
            `Placeholder markers found in quest copy:\n${failures.join('\n')}`
        ).toEqual([]);
    });
});
