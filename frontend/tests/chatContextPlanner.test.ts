import { describe, expect, it } from 'vitest';
import { planChatContext } from '../src/utils/chatContextPlanner.js';

const plan = (content: string) => planChatContext([{ role: 'user', content }]);

describe('planChatContext', () => {
    it.each([
        'hi',
        'hello',
        'thanks',
        'tell me a joke',
        'write a rocket haiku',
        'what are you?',
        'explain Kubernetes',
    ])('uses minimal mode for ungrounded turn %s', (content) => {
        expect(plan(content)).toEqual(
            expect.objectContaining({
                mode: 'minimal',
                includePlayerState: false,
                includeKnowledgePack: false,
                includeDocsRag: false,
                includePersonaVoiceSamples: true,
                confidence: 'high',
            })
        );
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
    ])('uses full mode for grounded turn %s', (content) => {
        const result = plan(content);
        expect(result.mode).toBe('full');
        expect(result.includePlayerState).toBe(true);
        expect(result.includeKnowledgePack).toBe(true);
        expect(result.includeDocsRag).toBe(true);
        expect(result.reasonCodes.length).toBeGreaterThan(0);
        expect(result.confidence).toBe('conservative');
    });
});
