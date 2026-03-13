import { describe, expect, it } from 'vitest';
import { resolveQuestPointer } from '../src/utils/questPointer.ts';

describe('resolveQuestPointer', () => {
    it('falls back to quest start when persisted step is missing or invalid', () => {
        const dialogueMap = new Map<string, unknown>([
            ['start', { id: 'start' }],
            ['prep', { id: 'prep' }],
        ]);

        expect(
            resolveQuestPointer({
                storedStepId: undefined,
                currentPointer: 'start',
                dialogueMap,
                questStart: 'start',
            })
        ).toBe('start');

        expect(
            resolveQuestPointer({
                storedStepId: true,
                currentPointer: 'start',
                dialogueMap,
                questStart: 'start',
            })
        ).toBe('start');
    });

    it('prefers valid stored progress when present', () => {
        const dialogueMap = new Map<string, unknown>([
            ['start', { id: 'start' }],
            ['prep', { id: 'prep' }],
        ]);

        expect(
            resolveQuestPointer({
                storedStepId: 'prep',
                currentPointer: 'start',
                dialogueMap,
                questStart: 'start',
            })
        ).toBe('prep');
    });
});
