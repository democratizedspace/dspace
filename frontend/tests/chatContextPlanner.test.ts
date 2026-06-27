import { describe, expect, it } from 'vitest';
import { latestUserContent, planChatContext } from '../src/utils/chatContextPlanner.js';

const planFor = (content: string) => planChatContext([{ role: 'user', content }]);

describe('planChatContext', () => {
    it.each([
        'hi',
        'hello',
        'thanks',
        'tell me a joke',
        'write a rocket haiku',
        'create a haiku',
        "what's the process for signing up?",
        'what item would you recommend for dinner?',
        'what are you?',
        'explain Kubernetes',
    ])('uses minimal mode for no-grounding turn: %s', (content) => {
        const plan = planFor(content);
        expect(plan.mode).toBe('minimal');
        expect(plan.includePlayerState).toBe(false);
        expect(plan.includeKnowledgePack).toBe(false);
        expect(plan.includeDocsRag).toBe(false);
        expect(plan.includePersonaVoiceSamples).toBe(true);
        expect(plan.reasonCodes).toContain('no-grounding-signals');
    });

    it.each([
        'what should I do next?',
        'what quest do I have left?',
        'How am I progressing?',
        'do I have enough green PLA?',
        'can I afford a solar tracker?',
        'where do I import a gamesave?',
        'How do I add custom content to DSPACE?',
        'how do I submit a custom quest?',
        'where are content bundles documented?',
        'how do I get to settings?',
        'what does this process consume?',
        'what rewards does preflight check give?',
        'what about the second option?',
        'Benchy',
        'dSolar',
        '/gamesaves',
        'what does this process create?',
        'custom item for a DSPACE quest',
    ])('uses full mode for grounded or ambiguous turn: %s', (content) => {
        const plan = planFor(content);
        expect(plan.mode).toBe('full');
        expect(plan.includePlayerState).toBe(true);
        expect(plan.includeKnowledgePack).toBe(true);
        expect(plan.includeDocsRag).toBe(true);
        expect(plan.reasonCodes.length).toBeGreaterThan(0);
    });
});

it('stringifies structured latest user content without throwing', () => {
    const content = latestUserContent([
        { role: 'user', content: [{ type: 'input_text', text: 'dSolar' }] },
    ]);

    expect(content).toBe('dSolar');
    expect(() => planChatContext([{ role: 'user', content: { text: 'hello' } }])).not.toThrow();
    expect(planChatContext([{ role: 'user', content: [{ text: 'dSolar' }] }]).mode).toBe('full');
});
