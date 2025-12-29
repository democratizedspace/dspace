import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

import { buildQuestGraph } from '../frontend/src/lib/quests/questGraph';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesRoot = path.resolve(__dirname, 'fixtures', 'questGraph');

const fixturePath = (...segments: string[]) => path.join(fixturesRoot, ...segments);

describe('buildQuestGraph diagnostics', () => {
    test('reports missing dependency references', async () => {
        const graph = await buildQuestGraph(fixturePath('missing'));
        expect(graph.diagnostics.missingRefs).toEqual([
            {
                from: 'welcome/howtodoquests.json',
                ref: 'missing-dependency',
                normalizedRef: 'missing-dependency.json'
            }
        ]);
    });

    test('reports ambiguous basename references', async () => {
        const graph = await buildQuestGraph(fixturePath('ambiguous'));
        expect(graph.diagnostics.ambiguousRefs).toEqual([
            {
                from: 'welcome/howtodoquests.json',
                ref: 'shared.json',
                normalizedRef: 'shared.json',
                candidates: ['alpha/shared.json', 'beta/shared.json']
            }
        ]);
    });

    test('detects simple cycles with stable paths', async () => {
        const graph = await buildQuestGraph(fixturePath('cycle'));
        expect(graph.diagnostics.cycles).toEqual([
            ['alpha/quest-a.json', 'beta/quest-b.json', 'alpha/quest-a.json']
        ]);
        expect(graph.depthByKey).toMatchObject({
            'welcome/howtodoquests.json': 0,
            'alpha/quest-a.json': 1,
            'beta/quest-b.json': 2
        });
    });
});

describe('buildQuestGraph determinism', () => {
    test('orders nodes, edges, and adjacency consistently', async () => {
        const graph = await buildQuestGraph(fixturePath('ordering'));
        expect(graph.nodes.map((node) => node.canonicalKey)).toEqual([
            'alpha/zeta.json',
            'beta/apple-2.json',
            'beta/apple.json',
            'beta/banana.json',
            'welcome/howtodoquests.json'
        ]);

        const rootRequires = graph.nodes.find(
            (node) => node.canonicalKey === 'welcome/howtodoquests.json'
        )?.requires;
        expect(rootRequires).toEqual([
            'alpha/zeta.json',
            'beta/apple-2.json',
            'beta/apple.json',
            'beta/banana.json'
        ]);

        expect(graph.edges).toEqual([
            { from: 'alpha/zeta.json', to: 'welcome/howtodoquests.json' },
            { from: 'beta/apple-2.json', to: 'welcome/howtodoquests.json' },
            { from: 'beta/apple.json', to: 'welcome/howtodoquests.json' },
            { from: 'beta/banana.json', to: 'welcome/howtodoquests.json' }
        ]);

        expect(graph.requiredBy['beta/apple.json']).toEqual(['welcome/howtodoquests.json']);
    });
});
