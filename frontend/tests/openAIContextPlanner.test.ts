import { beforeEach, describe, expect, it, vi } from 'vitest';
import { npcPersonas } from '../src/data/npcPersonas.js';
import {
    npcDialogueSamples,
    PERSONA_VOICE_SAMPLE_CHAR_LIMIT,
} from '../src/utils/npcDialogueSamples.js';

vi.mock('../src/utils/gameState/common.js', () => ({
    ready: Promise.resolve(),
    loadGameState: vi.fn(() => ({ inventory: {}, quests: {}, versionNumberString: '3' })),
}));

vi.mock('../src/utils/dchatKnowledge.js', () => ({
    buildDchatKnowledgePack: vi.fn(() => ({ summary: 'knowledge', sources: [] })),
}));

vi.mock('../src/utils/docsRag.js', () => ({
    searchDocsRag: vi.fn(async () => ({ excerptsText: 'Docs grounding', sources: [] })),
}));

const { buildChatPrompt } = await import('../src/utils/openAI.js');
const { buildDchatKnowledgePack } = await import('../src/utils/dchatKnowledge.js');
const { searchDocsRag } = await import('../src/utils/docsRag.js');

const persona = (id: string) => npcPersonas.find((entry) => entry.id === id)!;
const joinedPrompt = (payload: { combinedMessages: Array<{ content: string }> }) =>
    payload.combinedMessages.map((message) => message.content).join('\n\n');

describe('buildChatPrompt context planning', () => {
    beforeEach(() => {
        vi.mocked(buildDchatKnowledgePack).mockClear();
        vi.mocked(searchDocsRag).mockClear();
    });

    it('builds a small minimal prompt for hi without full grounding', async () => {
        const payload = await buildChatPrompt([{ role: 'user', content: 'hi' }], {
            includePromptMetrics: true,
        });
        const prompt = joinedPrompt(payload);

        expect(payload.contextPlan.mode).toBe('minimal');
        expect(payload.contextSources).toEqual([]);
        expect(prompt).not.toContain('PlayerState');
        expect(prompt).not.toContain('DSPACE knowledge base');
        expect(prompt).not.toContain('Docs grounding');
        expect(prompt).not.toContain('inventory highlights');
        expect(prompt).toContain('Never invent game facts or player state.');
        expect(prompt).toContain('Only give exact counts/durations/rates');
        expect(prompt).not.toContain('Use the PlayerState block when present.');
        expect(prompt).not.toContain('If PlayerState is missing');
        expect(prompt.length).toBeLessThan(5000);
        expect(payload.promptMetrics.contextPlan.mode).toBe('minimal');
        expect(buildDchatKnowledgePack).not.toHaveBeenCalled();
        expect(searchDocsRag).not.toHaveBeenCalled();
    });

    it('preserves Sydney persona and includes only Sydney voice samples in minimal mode', async () => {
        const payload = await buildChatPrompt([{ role: 'user', content: 'hi' }], {
            persona: persona('sydney'),
            includePromptMetrics: true,
        });
        const prompt = joinedPrompt(payload);

        expect(payload.contextPlan.mode).toBe('minimal');
        expect(prompt).toContain('You are Sydney');
        expect(prompt).toContain('additive manufacturing');
        expect(prompt).toContain('Persona voice examples for Sydney');
        expect(prompt).toContain(npcDialogueSamples.sydney[0]);
        expect(prompt).not.toContain('You are dChat, a helpful assistant in the game DSPACE');
        expect(prompt).not.toContain(npcDialogueSamples.nova[0]);
        expect(prompt).not.toContain(npcDialogueSamples.hydro[0]);
        expect(prompt).not.toContain(npcDialogueSamples.dchat[0]);
        expect(prompt).not.toContain('PlayerState');
        expect(prompt).not.toContain('DSPACE knowledge base');
        expect(prompt).not.toContain('Docs grounding');
        expect(payload.contextSources).toEqual([]);
        expect(payload.promptMetrics.contextPlan.personaVoiceSampleCount).toBeGreaterThan(0);
        expect(JSON.stringify(payload.contextSources)).not.toContain(npcDialogueSamples.sydney[0]);
        expect(JSON.stringify(payload.promptMetrics.contextPlan)).not.toContain(
            npcDialogueSamples.sydney[0]
        );
        expect(prompt).toContain('Never invent game facts or player state.');
        expect(prompt).not.toContain('Use the PlayerState block when present.');
        expect(prompt).not.toContain('If PlayerState is missing');
        expect(payload.promptMetrics.contextPlan.personaVoiceSampleCharacters).toBeLessThanOrEqual(
            PERSONA_VOICE_SAMPLE_CHAR_LIMIT
        );
    });

    it('preserves Nova persona and isolates Nova samples in minimal mode', async () => {
        const payload = await buildChatPrompt([{ role: 'user', content: 'hi' }], {
            persona: persona('nova'),
            includePromptMetrics: true,
        });
        const prompt = joinedPrompt(payload);

        expect(payload.contextPlan.mode).toBe('minimal');
        expect(prompt).toContain('You are Nova');
        expect(prompt).toContain('resident rocketry expert');
        expect(prompt).toContain('Persona voice examples for Nova');
        expect(prompt).toContain(npcDialogueSamples.nova[0]);
        expect(prompt).not.toContain(npcDialogueSamples.sydney[0]);
        expect(prompt).not.toContain(npcDialogueSamples.hydro[0]);
        expect(prompt).not.toContain(npcDialogueSamples.dchat[0]);
        expect(prompt).toContain('Never invent game facts or player state.');
        expect(prompt).not.toContain('Use the PlayerState block when present.');
        expect(prompt).not.toContain('If PlayerState is missing');
        expect(payload.contextSources).toEqual([]);
    });

    it('preserves Hydro persona and includes minimal-safe guardrails in minimal mode', async () => {
        const payload = await buildChatPrompt([{ role: 'user', content: 'hi' }], {
            persona: persona('hydro'),
        });
        const prompt = joinedPrompt(payload);

        expect(payload.contextPlan.mode).toBe('minimal');
        expect(prompt).toContain('You are Hydro');
        expect(prompt).toContain('hydroponics steward');
        expect(prompt).toContain('Persona voice examples for Hydro');
        expect(prompt).toContain(npcDialogueSamples.hydro[0]);
        expect(prompt).toContain('Never invent game facts or player state.');
        expect(prompt).not.toContain('Use the PlayerState block when present.');
        expect(prompt).not.toContain('If PlayerState is missing');
        expect(prompt).not.toContain('PlayerState');
        expect(prompt).not.toContain('DSPACE knowledge base');
        expect(payload.contextSources).toEqual([]);
    });

    it('adds answer focus after full context and before the latest user message', async () => {
        const latest = { role: 'user', content: 'what quest do I have left?' };
        const payload = await buildChatPrompt([latest], { includePromptMetrics: true });
        const messages = payload.combinedMessages;
        const latestIndex = messages.lastIndexOf(latest);
        const focusIndex = messages.findIndex((message) =>
            message.content.includes('Answer the final user message directly')
        );
        const playerStateIndex = messages.findIndex((message) =>
            message.content.includes('PlayerState')
        );
        const knowledgeIndex = messages.findIndex((message) =>
            message.content.includes('DSPACE knowledge base')
        );
        const focusContent = messages[focusIndex]?.content || '';

        expect(payload.contextPlan.mode).toBe('full');
        expect(focusIndex).toBeGreaterThan(knowledgeIndex);
        expect(focusIndex).toBeGreaterThan(playerStateIndex);
        expect(focusIndex).toBe(latestIndex - 1);
        expect(messages.at(-1)).toBe(latest);
        expect(focusContent.length).toBeLessThan(700);
        expect(focusContent).toContain(
            'Use PlayerState, focused game data, and docs grounding only when relevant.'
        );
        expect(focusContent).not.toContain(latest.content);
        expect(focusContent).not.toContain('{');
        expect(focusContent).not.toContain('Docs grounding');
        expect(focusContent).not.toContain('DSPACE knowledge base');
        expect(payload.promptMetrics.answerFocus).toEqual({
            included: true,
            characterCount: focusContent.length,
            placementIndex: focusIndex,
            latestUserMessageIndex: latestIndex,
        });
        expect(JSON.stringify(payload.promptMetrics.answerFocus)).not.toContain(latest.content);
        expect(JSON.stringify(payload.promptMetrics.answerFocus)).not.toContain(focusContent);
    });

    it('places answer focus after docs grounding and keeps latest gamesave question final', async () => {
        vi.mocked(searchDocsRag).mockResolvedValueOnce({
            excerptsText:
                '---\nDocs grounding (gitSha: test):\n- [route] Backups — /docs/backups#top\n  import saves\n---',
            sources: [{ type: 'doc', id: 'backups', label: 'Backups', url: '/docs/backups#top' }],
            sourcesMeta: { results: [{ id: 'backups' }] },
        });
        const latest = { role: 'user', content: 'where do I import a gamesave?' };
        const payload = await buildChatPrompt([latest], { includePromptMetrics: true });
        const messages = payload.combinedMessages;
        const latestIndex = messages.lastIndexOf(latest);
        const focusIndex = messages.findIndex((message) =>
            message.content.includes('Answer the final user message directly')
        );
        const docsIndex = messages.findIndex((message) =>
            message.content.includes('Docs grounding')
        );

        expect(payload.contextPlan.mode).toBe('full');
        expect(payload.contextPlan.includeDocsRag).toBe(true);
        expect(docsIndex).toBeGreaterThan(-1);
        expect(focusIndex).toBeGreaterThan(docsIndex);
        expect(focusIndex).toBe(latestIndex - 1);
        expect(messages.at(-1)).toBe(latest);
    });

    it('keeps answer focus out of minimal prompts and minimal metrics', async () => {
        const latest = { role: 'user', content: 'hi' };
        const payload = await buildChatPrompt([latest], { includePromptMetrics: true });
        const prompt = joinedPrompt(payload);

        expect(payload.contextPlan.mode).toBe('minimal');
        expect(prompt).not.toContain('Answer the final user message directly');
        expect(payload.promptMetrics.answerFocus).toEqual({
            included: false,
            characterCount: 0,
            placementIndex: -1,
            latestUserMessageIndex: -1,
        });
    });

    it('preserves Hydro persona and full grounding when planner selects full', async () => {
        const payload = await buildChatPrompt(
            [{ role: 'user', content: 'what quest do I have left?' }],
            { persona: persona('hydro'), includePromptMetrics: true }
        );
        const prompt = joinedPrompt(payload);

        expect(payload.contextPlan.mode).toBe('full');
        expect(payload.contextPlan.reasonCodes).toContain('player-state-progress');
        expect(payload.contextPlan.includeDocsRag).toBe(false);
        expect(payload.promptMetrics.docsRag.status).toBe('skipped');
        expect(prompt).toContain('You are Hydro');
        expect(prompt).toContain('hydroponics steward');
        expect(prompt).toContain('PlayerState');
        expect(prompt).toContain('DSPACE knowledge base');
        expect(prompt).toContain('Use the PlayerState block when present.');
        expect(prompt).toContain('If PlayerState is missing');
        expect(buildDchatKnowledgePack).toHaveBeenCalled();
        expect(searchDocsRag).not.toHaveBeenCalled();
    });

    it('includes docs RAG for route and custom-content full prompts', async () => {
        const routePayload = await buildChatPrompt(
            [{ role: 'user', content: 'where do I import a gamesave?' }],
            { includePromptMetrics: true }
        );

        expect(routePayload.contextPlan.mode).toBe('full');
        expect(routePayload.contextPlan.includeDocsRag).toBe(true);
        expect(routePayload.promptMetrics.docsRag.status).toBe('included');
        expect(searchDocsRag).toHaveBeenCalledTimes(1);

        vi.mocked(searchDocsRag).mockClear();

        const customPayload = await buildChatPrompt(
            [{ role: 'user', content: 'How do I add custom content to DSPACE?' }],
            { includePromptMetrics: true }
        );

        expect(customPayload.contextPlan.mode).toBe('full');
        expect(customPayload.contextPlan.includeDocsRag).toBe(true);
        expect(customPayload.contextPlan.docsRagReasonCodes).toContain('custom-content-docs');
        expect(searchDocsRag).toHaveBeenCalledTimes(1);
    });
});
