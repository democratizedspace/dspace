import { describe, expect, it } from 'vitest';
import { npcPersonas } from '../src/data/npcPersonas.js';
import {
    buildChatPrompt,
    fallbackSystemPrompt,
    fallbackWelcomeMessage,
    providerRealityLine,
    systemPolicyVersionLine,
} from '../src/utils/openAI.js';
import { dchatKnowledgeScaffoldingStrings } from '../src/utils/dchatKnowledge.js';

const forbiddenTokenPlacePattern = /token\.place.*\b(active|enabled|default)\b/i;
const negatedTokenPlacePattern =
    /token\.place.*\b(not\s+(active|enabled|default)|inactive|disabled)\b/i;
const forbiddenKeyPattern = /\b(no key needed|key not required)\b/i;
const allowedFuturePattern = /\bv3\.1\b|\bfuture\b|\bexperimental\b/i;

const collectPromptStrings = () => {
    const personaStrings = npcPersonas.flatMap((persona) =>
        [persona.systemPrompt, persona.welcomeMessage].filter(Boolean)
    );
    return [
        ...personaStrings,
        fallbackSystemPrompt,
        fallbackWelcomeMessage,
        providerRealityLine,
        ...dchatKnowledgeScaffoldingStrings,
    ];
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
            const hasAllowedFutureContext = allowedFuturePattern.test(promptText);
            const hasNegatedTokenPlace = negatedTokenPlacePattern.test(promptText);
            const hasForbiddenTokenPlace = forbiddenTokenPlacePattern.test(promptText);
            const hasForbiddenKey = forbiddenKeyPattern.test(promptText);

            if (hasForbiddenTokenPlace && !hasAllowedFutureContext && !hasNegatedTokenPlace) {
                expect(promptText).not.toMatch(forbiddenTokenPlacePattern);
            }

            if (hasForbiddenKey && !hasAllowedFutureContext) {
                expect(promptText).not.toMatch(forbiddenKeyPattern);
            }
        }
    });

    it('keeps policy guardrails and routes guidance in the system prompt', async () => {
        const { debugMessages } = await buildChatPrompt([
            { role: 'user', content: 'Check system guardrails.' },
        ]);
        const systemMessage = debugMessages.find(
            (message) => message.role === 'system' && message.kind === 'main'
        );
        const systemContent = systemMessage?.content ?? '';

        expect(systemContent).toContain(systemPolicyVersionLine);
        expect(systemContent).toContain('Never invent game facts or player state.');
        expect(systemContent).toContain('ask for a save snapshot via /gamesaves');
        expect(systemContent).toContain('cite /docs/routes');
        expect(systemContent).toContain('Never link to GitHub blob/tree URLs for docs');
        expect(systemContent).not.toContain('/docs/backups');
    });
});
