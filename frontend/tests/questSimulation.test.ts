import { describe, expect, it } from 'vitest';
import { runQuestSimulation } from '../src/utils/questSimulation.js';

describe('runQuestSimulation', () => {
    it('passes when a finish option is reachable from the start node', () => {
        const dialogue = [
            {
                id: 'start',
                text: 'Intro',
                options: [{ type: 'finish', text: 'Finish' }],
            },
        ];

        const result = runQuestSimulation(dialogue, 'start');

        expect(result.status).toBe('pass');
        expect(result.issues).toEqual([]);
    });

    it('fails when no finish option is reachable from the start node', () => {
        const dialogue = [
            {
                id: 'start',
                text: 'Intro',
                options: [{ type: 'goto', text: 'Next', goto: 'middle' }],
            },
            {
                id: 'middle',
                text: 'Middle',
                options: [{ type: 'goto', text: 'Loop', goto: 'middle' }],
            },
        ];

        const result = runQuestSimulation(dialogue, 'start');
        const issueTypes = result.issues.map((issue) => issue.type);

        expect(result.status).toBe('fail');
        expect(issueTypes).toContain('no_reachable_finish');
    });

    it('flags unreachable nodes and dead ends', () => {
        const dialogue = [
            {
                id: 'start',
                text: 'Intro',
                options: [{ type: 'goto', text: 'Next', goto: 'branch' }],
            },
            {
                id: 'branch',
                text: 'Branch',
                options: [{ type: 'goto', text: 'Loop', goto: 'branch' }],
            },
            {
                id: 'hidden',
                text: 'Hidden',
                options: [{ type: 'finish', text: 'Finish' }],
            },
        ];

        const result = runQuestSimulation(dialogue, 'start');
        const issueTypes = result.issues.map((issue) => issue.type);

        expect(result.status).toBe('fail');
        expect(issueTypes).toContain('dead_ends');
        expect(issueTypes).toContain('unreachable_nodes');
    });
});
