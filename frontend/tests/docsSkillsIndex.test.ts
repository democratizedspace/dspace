import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { getQuestTreesFromModulePaths } from '../src/utils/docsSkillsIndex.js';

const questsJsonRoot = path.join(process.cwd(), 'frontend/src/pages/quests/json');

describe('docs Skills quest-tree mapping', () => {
    it('maps quest module paths to exactly one tree per quests/json subdirectory', () => {
        const questTreeDirectories = fs
            .readdirSync(questsJsonRoot, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .sort((left, right) => left.localeCompare(right));

        const questModulePaths = questTreeDirectories.flatMap((tree) => {
            const treePath = path.join(questsJsonRoot, tree);
            return fs
                .readdirSync(treePath, { withFileTypes: true })
                .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
                .map((entry) => `../quests/json/${tree}/${entry.name}`);
        });

        const mappedTrees = getQuestTreesFromModulePaths(questModulePaths);

        expect(mappedTrees).toEqual(questTreeDirectories);
        expect(new Set(mappedTrees).size).toBe(questTreeDirectories.length);
    });
});
