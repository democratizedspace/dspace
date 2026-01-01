import { describe, expect, it } from 'vitest';

import { buildQuestGraph, type QuestData } from '../frontend/src/lib/quests/questGraph';
import { formatDiagnosticsReport } from '../frontend/src/lib/quests/questGraphReport';

const SAMPLE_QUESTS: QuestData[] = [
    {
        path: './json/welcome/howtodoquests.json',
        quest: {
            title: 'Root',
            requiresQuests: ['chain/b.json', 'missing.json', 'shared.json'],
        },
    },
    {
        path: './json/chain/b.json',
        quest: { title: 'Quest B', requiresQuests: ['chain/c.json'] },
    },
    {
        path: './json/chain/c.json',
        quest: { title: 'Quest C', requiresQuests: ['welcome/howtodoquests.json'] },
    },
    { path: './json/ambiguous/alpha/shared.json', quest: { title: 'Shared Alpha' } },
    { path: './json/ambiguous/beta/shared.json', quest: { title: 'Shared Beta' } },
    {
        path: './json/ambiguous/needs.json',
        quest: { title: 'Needs Shared', requiresQuests: ['shared.json'] },
    },
    { path: './json/orphan/alone.json', quest: { title: 'Alone' } },
    {
        path: './json/multi/child.json',
        quest: {
            title: 'Multi child',
            requiresQuests: ['welcome/howtodoquests.json', 'chain/b.json'],
        },
    },
];

describe('quest graph diagnostics report', () => {
    it('produces deterministic, sorted output', () => {
        const graph = buildQuestGraph({ quests: SAMPLE_QUESTS });
        const options = {
            timestamp: '2025-01-01T00:00:00.000Z',
            includeMultiParent: true,
            multiParentLimit: 20,
        };

        const first = formatDiagnosticsReport(graph, options);
        const second = formatDiagnosticsReport(graph, options);

        expect(first).toBe(second);
        expect(JSON.parse(first)).toEqual({
            timestamp: '2025-01-01T00:00:00.000Z',
            rootKey: 'welcome/howtodoquests.json',
            missingRefs: [{ from: 'welcome/howtodoquests.json', ref: 'missing.json' }],
            ambiguousRefs: [
                {
                    from: 'ambiguous/needs.json',
                    ref: 'shared.json',
                    candidates: ['ambiguous/alpha/shared.json', 'ambiguous/beta/shared.json'],
                },
                {
                    from: 'welcome/howtodoquests.json',
                    ref: 'shared.json',
                    candidates: ['ambiguous/alpha/shared.json', 'ambiguous/beta/shared.json'],
                },
            ],
            unreachableNodes: [
                'ambiguous/needs.json',
                'ambiguous/alpha/shared.json',
                'ambiguous/beta/shared.json',
                'orphan/alone.json',
            ],
            cycles: [
                ['chain/b.json', 'welcome/howtodoquests.json', 'chain/c.json', 'chain/b.json'],
            ],
            multiParentQuests: [
                {
                    canonicalKey: 'multi/child.json',
                    title: 'Multi child',
                    requires: ['chain/b.json', 'welcome/howtodoquests.json'],
                    requiresCount: 2,
                },
            ],
            counts: {
                missingRefs: 1,
                ambiguousRefs: 2,
                unreachableNodes: 4,
                cycles: 1,
                multiParentQuests: 1,
            },
        });
    });
});
