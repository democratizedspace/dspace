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
    ])('uses minimal mode for ungrounded message: %s', (content) => {
        expect(planFor(content)).toEqual(
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
        ['what should I do next?', 'player-state-progress'],
        ['what quest do I have left?', 'player-state-progress'],
        ['do I have enough green PLA?', 'player-state-progress'],
        ['can I afford a solar tracker?', 'player-state-progress'],
        ['where do I import a gamesave?', 'docs-navigation'],
        ['how do I get to settings?', 'docs-navigation'],
        ['what does this process consume?', 'game-data'],
        ['what rewards does preflight check give?', 'player-state-progress'],
        ['what about the second option?', 'vague-followup'],
        ['Benchy', 'dspace-entity'],
        ['dSolar', 'dspace-entity'],
        ['/gamesaves', 'docs-navigation'],
    ])('uses full mode for grounded message: %s', (content, reasonCode) => {
        expect(planFor(content)).toEqual(
            expect.objectContaining({
                mode: 'full',
                includePlayerState: true,
                includeKnowledgePack: true,
                includeDocsRag: true,
                includePersonaVoiceSamples: false,
                confidence: 'conservative',
                reasonCodes: expect.arrayContaining([reasonCode]),
            })
        );
    });
});
