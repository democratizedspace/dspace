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
        'what quest do I have left?',
        'what should I do next?',
        'do I have enough green PLA?',
        'can I afford a solar tracker?',
        'what is my inventory?',
        'how many quests have I completed?',
        'How am I progressing?',
        'what about the second option?',
        'Benchy',
        'dSolar',
    ])('uses full mode without docs RAG for player-state-only turn: %s', (content) => {
        const plan = planFor(content);
        expect(plan.mode).toBe('full');
        expect(plan.includePlayerState).toBe(true);
        expect(plan.includeKnowledgePack).toBe(true);
        expect(plan.includeDocsRag).toBe(false);
        expect(plan.docsRagReasonCodes).toEqual(['docs-rag-not-needed']);
        expect(plan.reasonCodes.length).toBeGreaterThan(0);
    });

    it.each([
        'where do I import a gamesave?',
        'how do I get to settings?',
        'How do I add custom content to DSPACE?',
        'how do I submit a custom quest?',
        'where is the content backup page?',
        'what changed in v3.1 chat?',
        'what does this process consume?',
        'what rewards does preflight check give?',
        '/gamesaves',
        'where are content bundles documented?',
        'what does this process create?',
        'custom item for a DSPACE quest',
    ])('uses full mode with docs RAG for docs-like turn: %s', (content) => {
        const plan = planFor(content);
        expect(plan.mode).toBe('full');
        expect(plan.includePlayerState).toBe(true);
        expect(plan.includeKnowledgePack).toBe(true);
        expect(plan.includeDocsRag).toBe(true);
        expect(plan.docsRagReasonCodes.length).toBeGreaterThan(0);
        expect(plan.docsRagReasonCodes).not.toContain('docs-rag-not-needed');
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
