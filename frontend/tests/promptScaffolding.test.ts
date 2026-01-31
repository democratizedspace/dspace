import { describe, expect, it } from 'vitest';
import { npcPersonas } from '../src/data/npcPersonas.js';
import {
    buildChatPrompt,
    fallbackSystemPrompt,
    providerRealityLine,
} from '../src/utils/openAI.js';

const forbiddenTokenPlacePattern = /token\.place.*\b(active|enabled|default)\b/i;
const forbiddenNoKeyPattern = /\b(no key needed|key not required)\b/i;
const allowedNoKeyQualifier = /\b(v3\.1|future|experimental)\b/i;

describe('prompt scaffolding regressions', () => {
    it('avoids stale token.place claims in persona and fallback prompts', () => {
        const prompts = [
            { id: 'fallback', text: fallbackSystemPrompt },
            ...npcPersonas.map((persona) => ({ id: persona.id, text: persona.systemPrompt })),
        ];

        for (const prompt of prompts) {
            if (!prompt.text) {
                continue;
            }
            expect(prompt.text).not.toMatch(forbiddenTokenPlacePattern);
            if (forbiddenNoKeyPattern.test(prompt.text)) {
                expect(prompt.text).toMatch(allowedNoKeyQualifier);
            }
        }
    });

    it('includes the provider reality line in the system prompt', async () => {
        const { debugMessages } = await buildChatPrompt([]);
        const systemMessage = debugMessages.find(
            (message) => message.role === 'system' && message.kind === 'main'
        );
        expect(systemMessage?.content ?? '').toContain(providerRealityLine);
    });
});
