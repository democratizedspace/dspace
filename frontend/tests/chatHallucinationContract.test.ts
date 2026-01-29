import { describe, expect, it } from 'vitest';
import { searchDocsRag } from '../src/utils/docsRag.js';
import { buildChatPrompt } from '../src/utils/openAI.js';
import { sortSources } from '../src/utils/contextSources.js';

const prompts = {
    customContent: 'How do I add custom content to DSPACE?',
    editQuests: 'Where do I edit quests?',
    backupExport: 'What can I back up or export?',
    inventory: "What's in my inventory right now?",
    tokenPlace: 'Is token.place active?',
    routes: 'What are the current game routes?',
};

const getRagContent = (payload) =>
    payload.debugMessages
        .filter((message) => message.kind === 'rag')
        .map((message) => message.content)
        .join('\n');

const expectDeterministicSources = (contextSources) => {
    expect(Array.isArray(contextSources)).toBe(true);
    expect(contextSources).toEqual(sortSources(contextSources));

    const seen = new Set();
    for (const source of contextSources) {
        const key = `${source.type}::${source.url ?? ''}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
    }
};

const expectDebugSeparation = (payload) => {
    const ragMessages = payload.debugMessages.filter((message) => message.kind === 'rag');
    expect(ragMessages.length).toBeGreaterThan(0);
    expect(payload.debugMessages.some((message) => message.kind === 'main')).toBe(true);
    const systemMain = payload.debugMessages.find(
        (message) => message.role === 'system' && message.kind === 'main'
    );
    expect(systemMain).toBeTruthy();
    return systemMain;
};

describe('QA 9.4.3 deterministic chat contracts', () => {
    it.each([prompts.customContent, prompts.editQuests, prompts.backupExport])(
        'grounds doc sources for "%s"',
        async (prompt) => {
            const payload = await buildChatPrompt([{ role: 'user', content: prompt }]);
            const ragContent = getRagContent(payload);
            const hasDocSource = payload.contextSources.some(
                (entry) => entry.type === 'doc' && entry.url?.startsWith('/docs/')
            );

            expect(ragContent).toContain('Docs grounding');
            expect(hasDocSource || ragContent.includes('/docs/')).toBe(true);
            expectDebugSeparation(payload);
            expectDeterministicSources(payload.contextSources);
        }
    );

    it('grounds changelog sources for token.place probe', async () => {
        const payload = await buildChatPrompt([{ role: 'user', content: prompts.tokenPlace }]);
        const ragContent = getRagContent(payload);
        const hasChangelogSource = payload.contextSources.some(
            (entry) => entry.type === 'changelog'
        );

        expect(ragContent).toContain('Docs grounding');
        expect(hasChangelogSource || ragContent.includes('/changelog')).toBe(true);
        expectDebugSeparation(payload);
        expectDeterministicSources(payload.contextSources);
    });

    it('grounds route sources for routes probe', async () => {
        const payload = await buildChatPrompt([{ role: 'user', content: prompts.routes }]);
        const ragContent = getRagContent(payload);
        const hasRouteSource = payload.contextSources.some((entry) => entry.type === 'route');

        expect(ragContent).toContain('Docs grounding');
        expect(hasRouteSource || ragContent.includes('/docs/routes')).toBe(true);
        expectDebugSeparation(payload);
        expectDeterministicSources(payload.contextSources);
    });

    it('keeps inventory probe grounded with guardrails', async () => {
        const payload = await buildChatPrompt([{ role: 'user', content: prompts.inventory }]);
        const systemMain = payload.debugMessages.find(
            (message) => message.role === 'system' && message.kind === 'main'
        );

        expect(systemMain).toBeTruthy();
        expect(systemMain?.content).toMatch(/never invent/i);
        expect(systemMain?.content).toMatch(/player state/i);
        expectDeterministicSources(payload.contextSources);
    });

    it.todo('Stage 7: inventory probe should ask for a save snapshot or note it cannot see saves');

    it.todo(
        'Stage 8: retrieval should include requires/consumes/creates + duration semantics doc chunk'
    );
});

describe('QA 9.4.3 RAG coverage checks', () => {
    it('retrieves docs routes grounding for route probe', async () => {
        const { excerptsText, sources } = await searchDocsRag(prompts.routes);

        expect(excerptsText).toContain('/docs/routes');
        expect(sources.some((entry) => entry.type === 'route')).toBe(true);
    });

    it('retrieves changelog grounding for token.place probe', async () => {
        const { excerptsText, sources } = await searchDocsRag(prompts.tokenPlace);

        expect(excerptsText).toContain('/changelog');
        expect(sources.some((entry) => entry.type === 'changelog')).toBe(true);
    });
});
