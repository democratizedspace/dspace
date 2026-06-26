import { describe, expect, it } from 'vitest';
import { planChatContext } from '../src/utils/chatContextPlanner.js';

const planFor = (content: string) => planChatContext([{ role: 'user', content }]);

describe('planChatContext', () => {
    it.each([
        'hi',
        'hello',
        'thanks',
        'tell me a joke',
        'write a rocket haiku',
        'what are you?',
        'explain Kubernetes',
    ])('chooses minimal for no-grounding turn: %s', (message) => {
        const plan = planFor(message);
        expect(plan.mode).toBe('minimal');
        expect(plan.includePlayerState).toBe(false);
        expect(plan.includeKnowledgePack).toBe(false);
        expect(plan.includeDocsRag).toBe(false);
        expect(plan.includePersonaVoiceSamples).toBe(true);
    });

    it.each([
        'what should I do next?',
        'what quest do I have left?',
        'do I have enough green PLA?',
        'can I afford a solar tracker?',
        'where do I import a gamesave?',
        'how do I get to settings?',
        'what does this process consume?',
        'what rewards does preflight check give?',
        'what about the second option?',
        'Benchy',
        'dSolar',
        '/gamesaves',
    ])('chooses full for grounded turn: %s', (message) => {
        const plan = planFor(message);
        expect(plan.mode).toBe('full');
        expect(plan.includePlayerState).toBe(true);
        expect(plan.includeKnowledgePack).toBe(true);
        expect(plan.includeDocsRag).toBe(true);
        expect(plan.reasonCodes.length).toBeGreaterThan(0);
    });
});
