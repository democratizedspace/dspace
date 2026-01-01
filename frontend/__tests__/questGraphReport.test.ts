import { describe, expect, it } from 'vitest';
import { buildQuestGraph } from '../src/lib/quests/questGraph';
import { formatDiagnosticsReport } from '../src/lib/quests/questGraphReport';

const FIXED_TIMESTAMP = '2024-01-02T03:04:05.000Z';

const questFixture = [
    {
        path: './json/welcome/howtodoquests.json',
        quest: {
            title: 'Root',
            requiresQuests: [
                './json/path/child-one.json',
                './json/shared.json',
                './json/nonexistent.json',
            ],
        },
    },
    {
        path: './json/path/child-one.json',
        quest: {
            title: 'Child One',
            requiresQuests: ['./json/cycles/start.json'],
        },
    },
    {
        path: './json/path/shared.json',
        quest: {
            title: 'Shared Path',
            requiresQuests: [],
        },
    },
    {
        path: './json/other/shared.json',
        quest: {
            title: 'Shared Other',
            requiresQuests: [],
        },
    },
    {
        path: './json/cycles/start.json',
        quest: {
            title: 'Cycle Start',
            requiresQuests: ['./json/cycles/end.json'],
        },
    },
    {
        path: './json/cycles/end.json',
        quest: {
            title: 'Cycle End',
            requiresQuests: ['./json/cycles/start.json'],
        },
    },
    {
        path: './json/unreachable/lone.json',
        quest: {
            title: 'Lone',
            requiresQuests: [],
        },
    },
    {
        path: './json/multi/branch.json',
        quest: {
            title: 'Branch',
            requiresQuests: [
                './json/welcome/howtodoquests.json',
                './json/path/shared.json',
                './json/cycles/start.json',
            ],
        },
    },
];

describe('questGraphReport', () => {
    it('formats deterministic diagnostics reports', () => {
        const graph = buildQuestGraph({ quests: questFixture });
        const first = formatDiagnosticsReport(graph, { timestamp: FIXED_TIMESTAMP });
        const second = formatDiagnosticsReport(graph, { timestamp: FIXED_TIMESTAMP });

        expect(first).toBe(second);

        const parsed = JSON.parse(first);

        expect(parsed.timestamp).toBe(FIXED_TIMESTAMP);
        expect(parsed.root).toBe('welcome/howtodoquests.json');
        expect(parsed.counts).toEqual({
            ambiguousRefs: 1,
            cycles: 1,
            missingRefs: 1,
            multiParent: 1,
            unreachableNodes: 1,
        });
        expect(parsed.diagnostics.missingRefs[0]).toEqual({
            from: 'welcome/howtodoquests.json',
            ref: './json/nonexistent.json',
        });
        expect(parsed.diagnostics.ambiguousRefs[0].candidates).toEqual([
            'other/shared.json',
            'path/shared.json',
        ]);
        expect(parsed.diagnostics.unreachableNodes[0]).toBe('unreachable/lone.json');
        expect(parsed.diagnostics.cycles[0][0]).toBe(parsed.diagnostics.cycles[0].at(-1));
        expect(parsed.multiParentTop[0]).toMatchObject({
            canonicalKey: 'multi/branch.json',
            requires: ['cycles/start.json', 'path/shared.json', 'welcome/howtodoquests.json'],
        });
    });
});
