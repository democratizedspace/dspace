import { describe, expect, it } from 'vitest';
import { npcPersonas } from '../src/data/npcPersonas.js';
import {
    buildChatPrompt,
    fallbackSystemPrompt,
    fallbackWelcomeMessage,
    providerRealityLine,
} from '../src/utils/openAI.js';
import { dchatKnowledgeScaffoldingStrings } from '../src/utils/dchatKnowledge.js';

const forbiddenTokenPlacePattern = /token\.place.*\b(active|enabled|default)\b/i;
const negatedTokenPlacePattern =
    /token\.place.*\b(not\s+(active|enabled|default)|inactive|disabled)\b/i;
const forbiddenKeyPattern = /\b(no key needed|key not required)\b/i;
const allowedFuturePattern = /\bv3\.1\b|\bfuture\b|\bexperimental\b/i;
const bundleSubmissionAnchor = '/docs/quest-submission#option-1-bundle-submission-recommended';
const questOnlySubmissionAnchor = '/docs/quest-submission#option-2-quest-only-submission';
const customBundlesAnchor = '/docs/custom-bundles';

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

    it('includes custom content submission guidance in the system prompt', async () => {
        const { debugMessages } = await buildChatPrompt([
            { role: 'user', content: 'How do I submit a custom quest?' },
        ]);
        const systemMessage = debugMessages.find(
            (message) => message.role === 'system' && message.kind === 'main'
        );
        const systemPrompt = systemMessage?.content ?? '';

        expect(systemPrompt).toContain(bundleSubmissionAnchor);
        expect(systemPrompt).toContain(customBundlesAnchor);
        expect(systemPrompt).toContain(questOnlySubmissionAnchor);
        expect(systemPrompt).toContain('custom items/processes');
        expect(systemPrompt).toContain('quest-only');
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
});
