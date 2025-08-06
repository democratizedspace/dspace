/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const { findQuestDependencyIssues } = require('../src/utils/questDependencies.js');

describe('Quest dependency integrity', () => {
    const questDir = path.join(__dirname, '../src/pages/quests/json');
    const files = globSync(path.join(questDir, '**/*.json'));
    const quests = new Map();

    files.forEach((file) => {
        const quest = JSON.parse(fs.readFileSync(file));
        quests.set(quest.id, quest);
    });

    test('all dependencies exist and contain no cycles', () => {
        const issues = findQuestDependencyIssues(quests);
        expect(issues).toEqual([]);
    });

    test('detects missing quests and circular dependencies', () => {
        const custom = new Map();
        custom.set('a', { id: 'a', requiresQuests: ['b'] });
        custom.set('b', { id: 'b', requiresQuests: ['c', 'd'] });
        custom.set('d', { id: 'd', requiresQuests: ['a'] });

        const issues = findQuestDependencyIssues(custom);
        const missing = issues.find((i) => i.includes('missing quest c'));
        const cycle = issues.find((i) => i.includes('Circular dependency'));
        expect(missing).toBeTruthy();
        expect(cycle).toBeTruthy();
    });

    test('handles explicit missing quest entries', () => {
        const broken = new Map();
        broken.set('missing', undefined);
        const issues = findQuestDependencyIssues(broken);
        expect(issues).toEqual(['Missing quest missing']);
    });

    test('handles quests without dependencies', () => {
        const simple = new Map();
        simple.set('root', { id: 'root' });
        simple.set('child', { id: 'child', requiresQuests: ['root'] });
        const issues = findQuestDependencyIssues(simple);
        expect(issues).toEqual([]);
    });

    test('detects self dependency', () => {
        const map = new Map();
        map.set('loop', { id: 'loop', requiresQuests: ['loop'] });
        const issues = findQuestDependencyIssues(map);
        expect(issues).toEqual(['Circular dependency involving loop']);
    });

    test('resolves linear chains without repeating nodes', () => {
        const chain = new Map();
        chain.set('a', { id: 'a', requiresQuests: ['b'] });
        chain.set('b', { id: 'b', requiresQuests: ['c'] });
        chain.set('c', { id: 'c' });
        const issues = findQuestDependencyIssues(chain);
        expect(issues).toEqual([]);
    });

    test('handles empty quest list', () => {
        const issues = findQuestDependencyIssues(new Map());
        expect(issues).toEqual([]);
    });

    test('reports missing quests when map entry is undefined', () => {
        const broken = new Map();
        broken.set('a', { id: 'a', requiresQuests: ['b'] });
        // Deliberately include the key but leave the value undefined
        broken.set('b', undefined);

        const issues = findQuestDependencyIssues(broken);
        expect(issues).toContain('Missing quest b');
    });
});
