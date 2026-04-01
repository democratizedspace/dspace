import { describe, it, expect } from 'vitest';
import { processQuest } from '../scripts/inject-ids.cjs';

describe('inject-ids script', () => {
    it('adds uuids and injects item/process refs', () => {
        const quest = {
            dialogue: [
                {
                    text: 'Start',
                    options: [
                        {
                            requiresItems: [{ name: 'Space Suit', count: 1 }],
                            grantsItems: [{ name: 'Wrench', count: 2 }],
                            processName: 'build rocket'
                        }
                    ]
                }
            ]
        } as any;
        const updated = processQuest(quest);
        expect(updated.id).toMatch(/[0-9a-f\-]{36}/);
        const node = updated.dialogue[0];
        expect(node.id).toMatch(/[0-9a-f\-]{36}/);
        const opt = node.options[0];
        expect(opt.requiresItems[0].id).toBe('space-suit');
        expect(opt.grantsItems[0].id).toBe('wrench');
        expect(opt.process).toBe('build-rocket');
        expect(opt.processName).toBeUndefined();
    });
});
