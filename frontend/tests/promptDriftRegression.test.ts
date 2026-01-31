import { describe, expect, it } from 'vitest';
import { npcPersonas } from '../src/data/npcPersonas.js';
import {
    buildChatPrompt,
    fallbackSystemPrompt,
    providerRealityLine,
} from '../src/utils/openAI.js';

const forbiddenTokenPlace = /token\.place.*\b(active|enabled|default)\b/i;
const forbiddenNoKey = /\b(no key needed|key not required)\b/i;
const allowedNoKeyContext = /\bv3\.1\b|future|experimental/i;

describe('prompt scaffolding drift regressions', () => {
    it('does not claim token.place is active or keyless in v3 prompts', () => {
        const prompts = [
            fallbackSystemPrompt,
            ...npcPersonas.map((persona) => persona.systemPrompt).filter(Boolean),
        ];

        for (const prompt of prompts) {
            expect(forbiddenTokenPlace.test(prompt)).toBe(false);

            if (forbiddenNoKey.test(prompt)) {
                expect(allowedNoKeyContext.test(prompt)).toBe(true);
            }
        }
    });

    it('includes provider reality line in the system prompt', async () => {
        const { debugMessages } = await buildChatPrompt([{ role: 'user', content: 'hello' }]);
        const systemMessage = debugMessages.find(
            (message) => message.role === 'system' && message.kind === 'main'
        );
        expect(systemMessage?.content ?? '').toContain(providerRealityLine);
    });
});
