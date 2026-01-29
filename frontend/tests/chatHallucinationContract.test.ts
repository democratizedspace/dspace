import { describe, expect, it } from 'vitest';
import { buildChatPrompt } from '../src/utils/openAI.js';
import { sortSources } from '../src/utils/contextSources.js';

const PROBES = {
    customContent: 'How do I add custom content to DSPACE?',
    questsEdit: 'Where do I edit quests?',
    backupExport: 'What can I back up or export?',
    inventory: 'What’s in my inventory right now?',
    tokenPlace: 'Is token.place active?',
    routes: 'What are the current game routes?',
};

const collectRagText = (debugMessages = []) =>
    debugMessages
        .filter((message) => message.kind === 'rag')
        .map((message) => message.content)
        .join('\n');

const getSystemMainMessage = (debugMessages = []) =>
    debugMessages.find((message) => message.role === 'system' && message.kind === 'main');

const assertSourcesDeterministic = (contextSources = []) => {
    expect(contextSources).toEqual(sortSources(contextSources));

    const urlSources = contextSources.filter((source) => source?.url);
    const seen = new Set();

    for (const source of urlSources) {
        const key = `${source.type}::${source.url}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
    }
};

describe('QA 9.4.3 hallucination contract', () => {
    it('includes docs RAG coverage for custom content questions', async () => {
        const prompts = [PROBES.customContent, PROBES.questsEdit, PROBES.backupExport];

        for (const prompt of prompts) {
            const payload = await buildChatPrompt([{ role: 'user', content: prompt }]);
            const ragText = collectRagText(payload.debugMessages);
            const hasDocSource = payload.contextSources.some(
                (source) => source.type === 'doc' && source.url?.startsWith('/docs/')
            );

            expect(hasDocSource || /\/docs\//.test(ragText)).toBe(true);
            expect(
                payload.debugMessages.some(
                    (message) => message.kind === 'rag' && /\/docs\//.test(message.content)
                )
            ).toBe(true);

            const systemMain = getSystemMainMessage(payload.debugMessages);
            expect(systemMain).toBeTruthy();
            expect(systemMain?.kind).toBe('main');

            assertSourcesDeterministic(payload.contextSources);
        }
    });

    it('includes docs RAG coverage for route questions', async () => {
        const payload = await buildChatPrompt([{ role: 'user', content: PROBES.routes }]);
        const ragText = collectRagText(payload.debugMessages);
        const hasRouteSource = payload.contextSources.some((source) => source.type === 'route');

        expect(hasRouteSource || /\/docs\/routes/.test(ragText) || /ROUTES/.test(ragText)).toBe(
            true
        );
        expect(
            payload.debugMessages.some(
                (message) =>
                    message.kind === 'rag' &&
                    (/\/docs\/routes/.test(message.content) || /ROUTES/.test(message.content))
            )
        ).toBe(true);

        const systemMain = getSystemMainMessage(payload.debugMessages);
        expect(systemMain).toBeTruthy();
        expect(systemMain?.kind).toBe('main');

        assertSourcesDeterministic(payload.contextSources);
    });

    it('includes changelog RAG coverage for token.place questions', async () => {
        const payload = await buildChatPrompt([{ role: 'user', content: PROBES.tokenPlace }]);
        const ragText = collectRagText(payload.debugMessages);
        const hasChangelogSource = payload.contextSources.some(
            (source) => source.type === 'changelog'
        );

        expect(hasChangelogSource || /\/changelog/.test(ragText)).toBe(true);
        expect(
            payload.debugMessages.some(
                (message) => message.kind === 'rag' && /\/changelog/.test(message.content)
            )
        ).toBe(true);

        const systemMain = getSystemMainMessage(payload.debugMessages);
        expect(systemMain).toBeTruthy();
        expect(systemMain?.kind).toBe('main');

        assertSourcesDeterministic(payload.contextSources);
    });

    it('includes a guardrail against inventing player state for inventory prompts', async () => {
        const payload = await buildChatPrompt([{ role: 'user', content: PROBES.inventory }]);
        const systemMain = getSystemMainMessage(payload.debugMessages);

        expect(systemMain).toBeTruthy();
        expect(systemMain?.content).toContain('Never invent');
        expect(systemMain?.content.toLowerCase()).toContain('player state');

        assertSourcesDeterministic(payload.contextSources);
    });

    it.todo(
        'Stage 7: inventory prompts should ask for a save snapshot when player state ' +
            'is missing'
    );

    it.todo(
        'Stage 8: process semantics prompt should retrieve requires/consumes/creates ' +
            'duration docs'
    );
});
