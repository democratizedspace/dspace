import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { getQuestTreesFromModulePaths, mergeSkillLinks } from '../src/utils/docsSkillsIndex.js';

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

    it('has a docs slug for every discovered quest tree', () => {
        const questTreeDirectories = fs
            .readdirSync(questsJsonRoot, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .sort((left, right) => left.localeCompare(right));

        const docsRoot = path.join(process.cwd(), 'frontend/src/pages/docs/md');
        const docsSlugs = fs
            .readdirSync(docsRoot, { withFileTypes: true })
            .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
            .map((entry) => entry.name.replace(/\.md$/, '').toLowerCase());

        const missingDocSlugs = questTreeDirectories.filter((tree) => !docsSlugs.includes(tree));

        expect(missingDocSlugs).toEqual([]);
    });

    it('preserves curated non-tree skill links while deduping aliased tree links', () => {
        const curatedLinks = [
            { title: 'Solar power', href: '/docs/solar', keywords: ['energy'] },
            { title: 'First aid', href: '/docs/first-aid', keywords: ['health'] },
        ];
        const generatedLinks = [
            { title: 'First Aid', href: '/docs/firstaid', keywords: ['firstaid'] },
            { title: 'Chemistry', href: '/docs/chemistry', keywords: ['chemistry'] },
        ];

        const mergedLinks = mergeSkillLinks({
            curatedLinks,
            generatedLinks,
            aliases: { 'first-aid': 'firstaid' },
        });

        expect(mergedLinks.map((link) => link.href)).toEqual([
            '/docs/chemistry',
            '/docs/first-aid',
            '/docs/solar',
        ]);
        expect(mergedLinks.filter((link) => link.href === '/docs/firstaid')).toHaveLength(0);
    });
});
