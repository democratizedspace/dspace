import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { buildQuestGraph } from '../frontend/src/lib/quests/questGraph';

type QuestData = {
    id?: string;
    title?: string;
    requiresQuests?: string[];
};

const tempDirs: string[] = [];

const createTempQuestDir = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-graph-'));
    tempDirs.push(dir);
    return dir;
};

const writeQuest = (baseDir: string, relativePath: string, data: QuestData) => {
    const targetPath = path.join(baseDir, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 4));
};

afterEach(() => {
    while (tempDirs.length > 0) {
        const dir = tempDirs.pop();
        if (dir) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    }
});

describe('buildQuestGraph diagnostics', () => {
    test('diagnoses missing dependency references', () => {
        const questDir = createTempQuestDir();
        writeQuest(questDir, 'welcome/howtodoquests.json', { title: 'Root quest' });
        writeQuest(questDir, 'alpha/needs-missing.json', {
            title: 'Needs Missing',
            requiresQuests: ['missing/dependency']
        });

        const graph = buildQuestGraph(questDir);

        expect(graph.diagnostics.missingRefs).toContainEqual({
            from: 'alpha/needs-missing.json',
            ref: 'missing/dependency'
        });
    });

    test('diagnoses ambiguous basenames when multiple quests share a filename', () => {
        const questDir = createTempQuestDir();
        writeQuest(questDir, 'welcome/howtodoquests.json', { title: 'Root quest' });
        writeQuest(questDir, 'zone-one/shared.json', { title: 'Shared One' });
        writeQuest(questDir, 'zone-two/shared.json', { title: 'Shared Two' });
        writeQuest(questDir, 'requestor/needs-shared.json', {
            title: 'Requests Shared',
            requiresQuests: ['shared.json']
        });

        const graph = buildQuestGraph(questDir);

        expect(graph.diagnostics.ambiguousRefs).toContainEqual({
            from: 'requestor/needs-shared.json',
            ref: 'shared.json',
            matches: ['zone-one/shared.json', 'zone-two/shared.json']
        });
        expect(graph.diagnostics.missingRefs).toEqual([]);
    });

    test(
        'identifies cycles with stable ordering and computes depth with feedback edge removal',
        () => {
            const questDir = createTempQuestDir();
            writeQuest(questDir, 'welcome/howtodoquests.json', { title: 'Root quest' });
            writeQuest(questDir, 'zone/a.json', {
                title: 'Quest A',
                requiresQuests: ['welcome/howtodoquests', 'zone/b']
            });
            writeQuest(questDir, 'zone/b.json', { title: 'Quest B', requiresQuests: ['zone/a'] });

            const graph = buildQuestGraph(questDir);

            expect(graph.diagnostics.cycles).toContainEqual([
                'zone/a.json',
                'zone/b.json',
                'zone/a.json'
            ]);
            expect(graph.depthByKey['zone/a.json']).toBe(1);
            expect(graph.depthByKey['zone/b.json']).toBe(2);
        }
    );
});

describe('quest ordering', () => {
    test('sorts by group, title, and canonical key', () => {
        const questDir = createTempQuestDir();
        writeQuest(questDir, 'welcome/howtodoquests.json', { title: 'How to do quests' });
        writeQuest(questDir, 'alpha/bravo.json', { title: 'Bravo' });
        writeQuest(questDir, 'alpha/alpha.json', { title: 'Alpha' });
        writeQuest(questDir, 'beta/alpha.json', { title: 'Alpha' });

        const graph = buildQuestGraph(questDir);
        const orderedKeys = graph.nodes.map((node) => node.canonicalKey);

        expect(orderedKeys).toEqual([
            'alpha/alpha.json',
            'alpha/bravo.json',
            'beta/alpha.json',
            'welcome/howtodoquests.json'
        ]);
    });
});
