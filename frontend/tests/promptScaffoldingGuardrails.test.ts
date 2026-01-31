import { describe, expect, it } from 'vitest';
import { npcPersonas } from '../src/data/npcPersonas.js';
import {
    buildChatPrompt,
    fallbackSystemPrompt,
    providerRealityLine,
} from '../src/utils/openAI.js';

const forbiddenTokenPlacePattern = /token\.place.*\b(active|enabled|default)\b/i;
const forbiddenKeyPattern = /\b(no key needed|key not required)\b/i;
const allowedFuturePattern = /\bv3\.1\b|\bfuture\b|\bexperimental\b/i;

const collectPromptStrings = () => {
    const personaStrings = npcPersonas.flatMap((persona) =>
        [persona.systemPrompt, persona.welcomeMessage].filter(Boolean)
    );
    return [...personaStrings, fallbackSystemPrompt];
};

describe('prompt scaffolding guardrails', () => {
    it('keeps provider reality line in the system prompt', async () => {
        const { debugMessages } = await buildChatPrompt([
            { role: 'user', content: 'What is the current provider?' },
        ]);
        const systemMessage = debugMessages.find(
            (message) => message.role === 'system' && message.kind === 'main'
        );
        expect(systemMessage?.content ?? '').toContain(providerRealityLine);
    });

    it('rejects stale token.place or no-key-needed phrasing', () => {
        for (const promptText of collectPromptStrings()) {
            expect(promptText).not.toMatch(forbiddenTokenPlacePattern);
            if (forbiddenKeyPattern.test(promptText)) {
                expect(promptText).toMatch(allowedFuturePattern);
            }
        }
    });
});
