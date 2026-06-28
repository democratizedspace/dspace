import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({
        openAI: {},
    })),
    ready: Promise.resolve(),
}));

vi.mock('../src/utils/dchatKnowledge.js', () => ({
    buildDchatKnowledge: vi.fn(() => 'knowledge'),
    buildDchatKnowledgePack: vi.fn(() => ({ summary: 'knowledge', sources: [] })),
}));

vi.mock('../src/utils/docsRag.js', () => ({
    searchDocsRag: vi.fn(async () => ({
        excerptsText: '',
        sources: [],
        sourcesMeta: { results: [] },
    })),
}));

vi.mock('../src/data/npcPersonas.js', () => ({
    npcPersonas: [
        {
            id: 'dchat',
            systemPrompt: 'system prompt',
            welcomeMessage: 'hello',
        },
    ],
}));

import {
    defaultOpenAIErrorMessage,
    describeOpenAIError,
    buildChatPrompt,
    CHAT_DOCS_RAG_DEFAULTS,
    CHAT_DOCS_RAG_PROMPT_BUDGET_CHARS,
    CHAT_DOCS_RAG_MIN_GROUNDING_CHARS,
    getOpenAIErrorSummary,
    GPT5Chat,
    GPT5ChatV2,
    validateChatResponseText,
} from '../src/utils/openAI.js';
import { buildDchatKnowledgePack } from '../src/utils/dchatKnowledge.js';
import { loadGameState } from '../src/utils/gameState/common.js';
import { searchDocsRag } from '../src/utils/docsRag.js';

class MockResponseClient {
    constructor(resolver) {
        this.responses = {
            create: resolver,
        };
    }
}

describe('GPT5Chat', () => {
    afterEach(() => {
        delete globalThis.__DSpaceOpenAIClient;
    });

    it('falls back to a supported model when the primary model is unavailable', async () => {
        const models = [];
        const resolver = vi.fn(async ({ model }) => {
            models.push(model);
            if (model === 'gpt-5.2') {
                const error = new Error('The model does not exist.');
                error.status = 404;
                error.error = { code: 'model_not_found' };
                throw error;
            }

            return { output_text: 'fallback response' };
        });

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(models).toEqual(['gpt-5.2', 'gpt-5-mini']);
        expect(result).toBe('fallback response');
    });

    it('attempts fallback when the primary model returns a permissioned model error', async () => {
        const models = [];
        const resolver = vi.fn(async ({ model }) => {
            models.push(model);
            if (model === 'gpt-5.2') {
                const error = new Error('model gated');
                error.status = 403;
                error.error = { code: 'model_not_found' };
                throw error;
            }

            return { output_text: 'fallback response' };
        });

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(models).toEqual(['gpt-5.2', 'gpt-5-mini']);
        expect(result).toBe('fallback response');
    });

    it('falls back when the error message indicates the model is unavailable', async () => {
        const models = [];
        const resolver = vi.fn(async ({ model }) => {
            models.push(model);
            if (model === 'gpt-5.2') {
                const error = new Error('The model gpt-5.2 does not exist for this organization.');
                error.status = 500;
                throw error;
            }

            return { output_text: 'fallback response' };
        });

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(models).toEqual(['gpt-5.2', 'gpt-5-mini']);
        expect(result).toBe('fallback response');
    });

    it('returns the primary response when the default model succeeds', async () => {
        const models = [];
        const resolver = vi.fn(async ({ model }) => {
            models.push(model);
            return { output_text: 'primary response' };
        });

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(models).toEqual(['gpt-5.2']);
        expect(result).toBe('primary response');
    });

    it('extracts output text from the content blocks when output_text is missing', async () => {
        const resolver = vi.fn(async () => ({
            output: [
                {
                    content: [
                        {
                            type: 'output_text',
                            text: 'content response',
                        },
                    ],
                },
            ],
        }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(resolver).toHaveBeenCalledTimes(1);
        expect(result).toBe('content response');
    });

    it('sends input_text content blocks in the payload', async () => {
        const resolver = vi.fn(async (payload) => {
            return {
                output_text: 'ok',
                received: payload,
            };
        });

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(resolver).toHaveBeenCalledTimes(1);
        const payload = resolver.mock.calls[0][0];
        expect(payload.input).toEqual([
            expect.objectContaining({
                role: 'system',
                content: [
                    {
                        type: 'input_text',
                        text: expect.any(String),
                    },
                ],
            }),
            expect.objectContaining({
                role: 'system',
                content: [
                    {
                        type: 'input_text',
                        text: expect.stringMatching(/Persona voice examples for dChat/i),
                    },
                ],
            }),
            {
                role: 'user',
                content: [
                    {
                        type: 'input_text',
                        text: 'Hello',
                    },
                ],
            },
        ]);
        expect(JSON.stringify(payload.input)).not.toContain('PlayerState v');
        expect(JSON.stringify(payload.input)).not.toContain('DSPACE knowledge base');
        expect(result).toBe('ok');
    });

    it('uses output_text content blocks for assistant history entries', async () => {
        const resolver = vi.fn(async () => ({
            output_text: 'follow up',
        }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([
            { role: 'assistant', content: 'Earlier reply' },
            { role: 'user', content: 'Hello again' },
        ]);

        expect(resolver).toHaveBeenCalledTimes(1);
        const payload = resolver.mock.calls[0][0];
        expect(payload.input).toEqual(
            expect.arrayContaining([
                {
                    role: 'assistant',
                    content: [
                        {
                            type: 'output_text',
                            text: 'Earlier reply',
                        },
                    ],
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'input_text',
                            text: 'Hello again',
                        },
                    ],
                },
            ])
        );
        expect(result).toBe('follow up');
    });

    it('falls back to output content when output_text is an empty string', async () => {
        const resolver = vi.fn(async () => ({
            output_text: '   ',
            output: [
                {
                    content: [
                        {
                            type: 'output_text',
                            text: 'content response',
                        },
                    ],
                },
            ],
        }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(result).toBe('content response');
    });

    it('extracts output_text from multiple output entries', async () => {
        const resolver = vi.fn(async () => ({
            output: [
                {
                    content: [
                        {
                            type: 'image',
                            text: 'ignore me',
                        },
                    ],
                },
                {
                    content: [
                        {
                            type: 'output_text',
                            text: 'second entry response',
                        },
                    ],
                },
            ],
        }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(result).toBe('second entry response');
    });

    it('returns empty string when no output_text content is present', async () => {
        const resolver = vi.fn(async () => ({
            output: [
                {
                    content: [
                        {
                            type: 'image',
                            text: 'ignore me',
                        },
                    ],
                },
            ],
        }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(result).toBe('');
    });

    it('returns empty string when no outputs exist', async () => {
        const resolver = vi.fn(async () => ({}));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5Chat([{ role: 'user', content: 'Hello' }]);

        expect(result).toBe('');
    });

    it('surfaces unexpected OpenAI errors without retrying', async () => {
        const resolver = vi.fn(async () => {
            const error = new Error('temporary outage');
            error.status = 500;
            throw error;
        });

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        await expect(GPT5Chat([{ role: 'user', content: 'Hello' }])).rejects.toThrow(
            'temporary outage'
        );
        expect(resolver).toHaveBeenCalledTimes(1);
    });
});

describe('GPT5ChatV2', () => {
    afterEach(() => {
        delete globalThis.__DSpaceOpenAIClient;
        vi.mocked(searchDocsRag).mockClear();
    });

    it('returns contextSources for route grounding', async () => {
        vi.mocked(searchDocsRag).mockResolvedValueOnce({
            excerptsText: 'routes excerpt',
            sources: [
                {
                    type: 'route',
                    id: 'docs/routes#top',
                    label: 'Routes',
                    url: '/docs/routes#top',
                },
            ],
            sourcesMeta: { results: [] },
        });

        const resolver = vi.fn(async () => ({ output_text: 'ok' }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5ChatV2([
            { role: 'user', content: 'What are the current routes?' },
        ]);

        expect(result.text).toBe('ok');
        expect(
            result.contextSources.some(
                (entry) => entry.type === 'route' && entry.url === '/docs/routes#top'
            )
        ).toBe(true);
    });

    it('returns contextSources for changelog grounding', async () => {
        vi.mocked(searchDocsRag).mockResolvedValueOnce({
            excerptsText: 'changelog excerpt',
            sources: [
                {
                    type: 'changelog',
                    id: 'changelog/token-place',
                    label: 'Changelog',
                    url: '/changelog#token-place',
                },
            ],
            sourcesMeta: { results: [] },
        });

        const resolver = vi.fn(async () => ({ output_text: 'ok' }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5ChatV2([{ role: 'user', content: 'Is token.place active?' }]);

        expect(result.text).toBe('ok');
        expect(
            result.contextSources.some(
                (entry) => entry.type === 'changelog' && entry.url?.startsWith('/changelog#')
            )
        ).toBe(true);
    });
});

describe('buildChatPrompt', () => {
    beforeEach(() => {
        vi.mocked(buildDchatKnowledgePack).mockClear();
        vi.mocked(searchDocsRag).mockClear();
    });

    it('adds guardrails for save snapshots, clarifying questions, and anti-precision', async () => {
        const payload = await buildChatPrompt([{ role: 'user', content: 'Status?' }]);
        const systemMessage = payload.debugMessages.find(
            (message) => message.role === 'system' && message.kind === 'main'
        );
        const content = systemMessage?.content ?? '';

        expect(content).toContain('Use the PlayerState block when present.');
        expect(content).toContain('/gamesaves');
        expect(content).toContain('/docs/backups');
        expect(content).toContain('Base64-encoded JSON snapshot');
        expect(content).toContain('envelope or raw state');
        expect(content).toMatch(/quests, inventory, and processes.*replaced/i);
        expect(content).toMatch(/clarifying question/i);
        expect(content).toMatch(/only give exact counts\/durations\/rates/i);
    });

    it('does not duplicate the shared guardrail when already present', async () => {
        const systemPrompt = [
            'Custom system prompt.',
            'Never invent game facts or player state.',
            'Use the PlayerState block when present.',
            'If PlayerState is missing, ask for a save snapshot via /gamesaves and cite ' +
                '/docs/backups or /docs/routes.',
            'When explaining /gamesaves, cite /docs/backups and use: Export: "Click Copy to place a ' +
                'Base64-encoded JSON snapshot on your clipboard." Import: "Paste the backup string into ' +
                'the field and select Import." Field label: "Paste a game state backup string (envelope ' +
                'or raw state) here:" Semantics: "Restoring means quests, inventory, and processes are ' +
                'replaced with the imported data."',
            "If you're missing context, say you don't know and ask a clarifying question OR point " +
                'to a specific /docs page.',
            'When giving URLs/navigation, cite /docs excerpts or docs/ROUTES.md.',
            'Only give exact counts/durations/rates if they appear in retrieved context; otherwise be ' +
                "approximate or say you don't know.",
        ].join('\n');

        const payload = await buildChatPrompt([{ role: 'user', content: 'Check guardrails.' }], {
            persona: {
                id: 'custom',
                systemPrompt,
                welcomeMessage: 'hello',
            },
        });
        const systemMessage = payload.debugMessages.find(
            (message) => message.role === 'system' && message.kind === 'main'
        );
        const content = systemMessage?.content ?? '';
        const occurrences = content.match(/save snapshot/gi) ?? [];
        const base64Occurrences = content.match(/base64-encoded json snapshot/gi) ?? [];
        const envelopeOccurrences = content.match(/envelope or raw state/gi) ?? [];
        const replacedOccurrences =
            content.match(/restoring means quests, inventory, and processes are replaced/gi) ?? [];

        expect(occurrences).toHaveLength(1);
        expect(base64Occurrences).toHaveLength(1);
        expect(envelopeOccurrences).toHaveLength(1);
        expect(replacedOccurrences).toHaveLength(1);
    });

    it('appends only missing guardrail lines when a persona includes some rules', async () => {
        const systemPrompt = [
            'Custom system prompt.',
            'Never invent game facts or player state.',
        ].join('\n');

        const payload = await buildChatPrompt([{ role: 'user', content: 'Check guardrails.' }], {
            persona: {
                id: 'custom',
                systemPrompt,
                welcomeMessage: 'hello',
            },
        });
        const systemMessage = payload.debugMessages.find(
            (message) => message.role === 'system' && message.kind === 'main'
        );
        const content = systemMessage?.content ?? '';
        const neverInventMatches = content.match(/never invent/gi) ?? [];

        expect(neverInventMatches).toHaveLength(1);
        expect(content).toContain('/gamesaves');
        expect(content).toMatch(/save snapshot/i);
        expect(content).toContain('/docs/routes');
    });

    it('injects compact PlayerState with quest counts and query-relevant inventory', async () => {
        vi.mocked(loadGameState).mockReturnValueOnce({
            openAI: {},
            versionNumberString: '3',
            quests: {
                'welcome/howtodoquests': { finished: true },
                'welcome/intro-inventory': { finished: false },
                '3dprinter/start': { finished: true },
            },
            inventory: {
                'd3590107-25ff-4de5-af3a-46e2497bfc52': 12,
                'item-beta': 0,
                'item-gamma': 5.5,
            },
        });

        const payload = await buildChatPrompt([
            { role: 'user', content: 'do I have enough green PLA?' },
        ]);
        const playerStateMessage = payload.debugMessages.find((message) =>
            message.content?.includes('PlayerStateCompact v3')
        );
        const content = playerStateMessage?.content ?? '';

        expect(content).toContain('Official quests: completed');
        expect(content).toContain('green PLA filament');
        expect(content).toContain('=12');
        expect(content).not.toContain('questsFinished');
        expect(content).not.toContain('item-gamma');
        expect(payload.playerStateSummary).toEqual(
            expect.objectContaining({
                included: true,
                playerStatePromptMode: 'compact',
                questsFinishedCount: 2,
                completedQuestCount: 1,
                inventoryIncludedCount: 1,
                inventoryTruncated: true,
            })
        );
    });

    it('does not count unknown finished quests toward official quest stats', async () => {
        vi.mocked(loadGameState).mockReturnValueOnce({
            openAI: {},
            versionNumberString: '3',
            quests: {
                'welcome/howtodoquests': { finished: true },
                'custom/non-official': { finished: true },
            },
            inventory: {},
        });

        const payload = await buildChatPrompt([{ role: 'user', content: 'Quest totals?' }]);
        const playerStateMessage = payload.debugMessages.find((message) =>
            message.content?.includes('PlayerStateCompact')
        );
        const content = playerStateMessage?.content ?? '';

        expect(content).toContain('Official quests: completed 1/');
        expect(payload.playerStateSummary.completedQuestCount).toBe(1);
        expect(payload.playerStateSummary.totalOfficialQuestCount).toBeGreaterThan(1);
        expect(payload.playerStateSummary.remainingOfficialQuestCount).toBe(
            payload.playerStateSummary.totalOfficialQuestCount - 1
        );
    });

    it('skips docs RAG for player-state-only full prompts', async () => {
        const payload = await buildChatPrompt(
            [{ role: 'user', content: 'what quest do I have left?' }],
            {
                includePromptMetrics: true,
            }
        );
        const prompt = payload.combinedMessages.map((message) => message.content).join('\n');

        expect(payload.contextPlan.mode).toBe('full');
        expect(payload.contextPlan.includeDocsRag).toBe(false);
        expect(prompt).toContain('PlayerState');
        expect(prompt).toContain('DSPACE knowledge base');
        expect(prompt).not.toContain('Docs grounding');
        expect(searchDocsRag).not.toHaveBeenCalled();
        expect(payload.contextSources.every((source) => source.type !== 'doc')).toBe(true);
        expect(payload.promptMetrics.docsRag.status).toBe('skipped');
    });

    it('adds answer-focus before the latest user message for player-state full prompts', async () => {
        const latest = { role: 'user', content: 'what quest do I have left?' };
        const payload = await buildChatPrompt([latest], { includePromptMetrics: true });
        const messages = payload.combinedMessages;
        const latestIndex = messages.lastIndexOf(latest);
        const focusIndex = messages.findIndex((message) =>
            message.content?.includes('Answer the final user message directly.')
        );
        const playerStateIndex = messages.findIndex((message) =>
            message.content?.includes('PlayerState')
        );
        const knowledgeIndex = messages.findIndex((message) =>
            message.content?.includes('DSPACE knowledge base')
        );

        expect(payload.contextPlan.mode).toBe('full');
        expect(focusIndex).toBeGreaterThan(knowledgeIndex);
        expect(focusIndex).toBeGreaterThan(playerStateIndex);
        expect(focusIndex).toBe(latestIndex - 1);
        expect(messages.at(-1)).toBe(latest);
        expect(messages[focusIndex].role).toBe('system');
        expect(messages[focusIndex].content).not.toContain(latest.content);
        expect(messages[focusIndex].content).not.toContain('PlayerStateCompact');
        expect(messages[focusIndex].content).not.toContain('DSPACE knowledge base');
        expect(messages[focusIndex].content).not.toContain('Docs grounding');
        expect(payload.promptMetrics.answerFocus).toEqual({
            included: true,
            characterCount: messages[focusIndex].content.length,
            placementIndex: focusIndex,
            latestUserMessageIndex: latestIndex,
        });
        expect(JSON.stringify(payload.promptMetrics.answerFocus)).not.toContain(latest.content);
        expect(JSON.stringify(payload.promptMetrics.answerFocus)).not.toContain(
            messages[focusIndex].content
        );
    });

    it('exposes only safe PlayerState summary fields in prompt metrics', async () => {
        vi.mocked(loadGameState).mockReturnValueOnce({
            openAI: {},
            versionNumberString: '3',
            quests: {
                'welcome/howtodoquests': { finished: true },
                'custom/non-official': { finished: true },
            },
            inventory: {
                'd3590107-25ff-4de5-af3a-46e2497bfc52': 12,
                'secret-item-id': 99,
            },
        });

        const payload = await buildChatPrompt(
            [{ role: 'user', content: 'do I have enough green PLA?' }],
            { includePromptMetrics: true }
        );
        const summary = payload.promptMetrics.playerStateSummary;

        expect(summary).toEqual({
            playerStatePromptMode: 'compact',
            completedQuestCount: 1,
            totalOfficialQuestCount: expect.any(Number),
            remainingOfficialQuestCount: expect.any(Number),
            remainingQuestIncludedCount: expect.any(Number),
            inventoryTotalCount: 2,
            inventoryIncludedCount: 1,
            inventoryTruncated: true,
            activeProcessIncludedCount: 0,
            blockCharCount: expect.any(Number),
            questsFinishedCount: 2,
        });
        expect(JSON.stringify(summary)).not.toContain('secret-item-id');
        expect(JSON.stringify(summary)).not.toContain('green PLA filament');
        expect(JSON.stringify(summary)).not.toContain('welcome/howtodoquests');
    });

    it('reports forced docs RAG consistently in plan metadata and prompt metrics', async () => {
        vi.mocked(searchDocsRag).mockResolvedValueOnce({
            excerptsText: `---
Docs grounding (gitSha: test):
- [doc] Forced docs
---`,
            sources: [{ type: 'doc', id: 'forced', label: 'Forced docs', url: '/docs/forced#top' }],
            sourcesMeta: { results: [{ id: 'forced' }] },
        });

        const payload = await buildChatPrompt(
            [{ role: 'user', content: 'what quest do I have left?' }],
            { forceDocsRag: true, includePromptMetrics: true }
        );

        expect(searchDocsRag).toHaveBeenCalled();
        expect(payload.contextPlan.includeDocsRag).toBe(true);
        expect(payload.contextPlan.docsRagStatus).toBe('included');
        expect(payload.contextPlan.docsRagReasonCodes).toContain('docs-rag-forced');
        expect(payload.contextPlan.docsRagReasonCodes).not.toEqual(['docs-rag-not-needed']);
        expect(payload.promptMetrics.docsRag.includeDocsRag).toBe(true);
        expect(payload.promptMetrics.docsRag.status).toBe('included');
        expect(payload.promptMetrics.docsRag.resultCount).toBe(1);
        expect(payload.promptMetrics.docsRag.renderedChars).toBeGreaterThan(0);
        expect(payload.promptMetrics.docsRag.budget).toEqual(
            expect.objectContaining(CHAT_DOCS_RAG_DEFAULTS)
        );
        expect(JSON.stringify(payload.promptMetrics.docsRag)).not.toContain('Forced docs');
    });

    it('includes docs RAG for gamesave route prompts', async () => {
        vi.mocked(searchDocsRag).mockResolvedValueOnce({
            excerptsText: `---\nDocs grounding (gitSha: test):\n- [route] Backups — /docs/backups#top\n  import saves\n---`,
            sources: [{ type: 'doc', id: 'backups', label: 'Backups', url: '/docs/backups#top' }],
            sourcesMeta: { results: [] },
        });

        const payload = await buildChatPrompt([
            { role: 'user', content: 'where do I import a gamesave?' },
        ]);
        const prompt = payload.combinedMessages.map((message) => message.content).join('\n');

        expect(payload.contextPlan.mode).toBe('full');
        expect(payload.contextPlan.includeDocsRag).toBe(true);
        expect(searchDocsRag).toHaveBeenCalled();
        expect(prompt).toContain('Docs grounding');
        expect(payload.contextSources.some((source) => source.type === 'doc')).toBe(true);

        const focusIndex = payload.combinedMessages.findIndex((message) =>
            message.content?.includes('Answer the final user message directly.')
        );
        const latestIndex = payload.combinedMessages.length - 1;
        const docsIndex = payload.combinedMessages.findIndex((message) =>
            message.content?.includes('Docs grounding')
        );

        expect(focusIndex).toBeGreaterThan(docsIndex);
        expect(focusIndex).toBe(latestIndex - 1);
        expect(payload.combinedMessages.at(-1)).toEqual({
            role: 'user',
            content: 'where do I import a gamesave?',
        });
    });

    it('keeps focused game-data context and adds answer-focus for resource comparison prompts', async () => {
        vi.mocked(buildDchatKnowledgePack).mockReturnValueOnce({
            summary:
                'Focused game data:\nRelevant processes:\n- 3D print a model rocket\n- 3D print a Benchy',
            sources: [{ type: 'process', id: 'benchy', label: 'Benchy' }],
            focusedGameData: {
                included: true,
                selectedProcessCount: 2,
                selectedItemCount: 0,
                selectedQuestCount: 0,
                selectedAchievementCount: 0,
                selectedInventoryCount: 1,
                selectedProcessIds: ['print-rocket', 'benchy'],
                renderedChars: 90,
                reasonCodes: ['focused-game-data'],
            },
        });
        const latest = {
            role: 'user',
            content: "I'd like to make a 3D printed rocket and 10 benchies. Is it enough for that?",
        };

        const payload = await buildChatPrompt([latest], { includePromptMetrics: true });
        const prompt = payload.combinedMessages.map((message) => message.content).join('\n');
        const focusIndex = payload.combinedMessages.findIndex((message) =>
            message.content?.includes('Answer the final user message directly.')
        );

        expect(payload.contextPlan.mode).toBe('full');
        expect(payload.promptMetrics.focusedGameData).toEqual(
            expect.objectContaining({ included: true, selectedProcessCount: 2 })
        );
        expect(prompt).toContain('Focused game data:');
        expect(prompt).not.toContain('Complete item catalog');
        expect(prompt).not.toContain('Complete quest catalog');
        expect(focusIndex).toBe(payload.combinedMessages.length - 2);
        expect(payload.combinedMessages.at(-1)).toBe(latest);
    });

    it('keeps answer-focus out of minimal prompts and reports safe metrics', async () => {
        const payload = await buildChatPrompt([{ role: 'user', content: 'hi' }], {
            includePromptMetrics: true,
        });
        const prompt = payload.combinedMessages.map((message) => message.content).join('\n');

        expect(payload.contextPlan.mode).toBe('minimal');
        expect(prompt).not.toContain('PlayerState');
        expect(prompt).not.toContain('DSPACE knowledge base');
        expect(prompt).not.toContain('Docs grounding');
        expect(prompt).not.toContain('Answer the final user message directly.');
        expect(payload.contextSources).toEqual([]);
        expect(payload.promptMetrics.answerFocus).toEqual({
            included: false,
            characterCount: 0,
            placementIndex: -1,
            latestUserMessageIndex: -1,
        });
    });

    it('preserves selected persona identity when answer-focus is added', async () => {
        const persona = {
            id: 'sydney',
            name: 'Sydney',
            systemPrompt: 'You are Sydney, a careful mission planner.',
            welcomeMessage: 'Sydney here.',
        };
        const payload = await buildChatPrompt(
            [{ role: 'user', content: 'what quest do I have left?' }],
            { persona }
        );
        const systemPrompt = payload.combinedMessages[0].content;
        const focusMessage = payload.combinedMessages.find((message) =>
            message.content?.includes('Answer the final user message directly.')
        );

        expect(systemPrompt).toContain('You are Sydney');
        expect(focusMessage?.content).toBeTruthy();
        expect(focusMessage.content).not.toContain('dChat');
        expect(focusMessage.content).not.toContain('You are');
    });

    it('does not duplicate docs excerpts when knowledge summary exists', async () => {
        vi.mocked(buildDchatKnowledgePack).mockReturnValueOnce({
            summary: 'Summary entry',
            sources: [],
        });
        vi.mocked(searchDocsRag).mockResolvedValueOnce({
            excerptsText: `---\nDocs grounding (gitSha: test):\n- [doc] Routes — /docs/routes#top\n  sample\n---`,
            sources: [],
            sourcesMeta: { results: [] },
        });

        const payload = await buildChatPrompt([{ role: 'user', content: 'Routes?' }]);
        const ragMessages = payload.debugMessages.filter((message) => message.kind === 'rag');
        const debugContent = payload.debugMessages.map((message) => message.content).join('\n');
        const combinedContent = payload.combinedMessages
            .map((message) => message.content)
            .join('\n');

        expect(ragMessages).toHaveLength(1);
        const ragContent = ragMessages[0].content;
        const ragMatches = ragContent.match(/Docs grounding/g) || [];
        expect(ragMatches).toHaveLength(1);
        const debugMatches = debugContent.match(/Docs grounding/g) || [];
        expect(debugMatches).toHaveLength(1);
        const combinedMatches = combinedContent.match(/Docs grounding/g) || [];
        expect(combinedMatches).toHaveLength(1);
        expect(ragContent).toContain('DSPACE knowledge base:');
        expect(combinedContent).toContain('DSPACE knowledge base:');
        expect(buildDchatKnowledgePack).toHaveBeenCalled();
    });

    it('expands docs retrieval queries for vague follow-ups with capped context', async () => {
        const longUserDetail = 'Details about crafting a rocket. '.repeat(30);
        const longAssistantDetail = 'Step guidance for the build. '.repeat(30);
        vi.mocked(searchDocsRag).mockResolvedValueOnce({
            excerptsText: '',
            sources: [],
            sourcesMeta: { results: [] },
        });
        const messages = [
            {
                role: 'user',
                content: `How do I craft a rocket in DSPACE? ${longUserDetail}`,
            },
            {
                role: 'assistant',
                content: `You start by gathering materials. ${longAssistantDetail}`,
            },
            {
                role: 'user',
                content: 'what about the second step?',
            },
        ];

        await buildChatPrompt(messages, { forceDocsRag: true });

        const retrievalQuery = vi.mocked(searchDocsRag).mock.calls[0][0];

        expect(retrievalQuery).toContain('what about the second step?');
        expect(retrievalQuery).toContain('How do I craft a rocket in DSPACE?');
        expect(retrievalQuery).toContain('You start by gathering materials.');
        expect(retrievalQuery).toContain('Previous context:');
        const contextBlock = retrievalQuery.split('Previous context:')[1]?.trim() ?? '';
        expect(contextBlock.length).toBeLessThanOrEqual(800);
        expect(retrievalQuery.length).toBeLessThanOrEqual(1000);
    });

    it('keeps docs retrieval queries unchanged for non-vague prompts', async () => {
        const latestMessage =
            'Can you explain the full process for crafting a rocket, including materials and steps?';
        vi.mocked(searchDocsRag).mockResolvedValueOnce({
            excerptsText: '',
            sources: [],
            sourcesMeta: { results: [] },
        });
        const messages = [
            {
                role: 'user',
                content: 'Any tips for early quests?',
            },
            {
                role: 'assistant',
                content: 'Start with the tutorial quest.',
            },
            {
                role: 'user',
                content: latestMessage,
            },
        ];

        await buildChatPrompt(messages, { forceDocsRag: true });

        const retrievalQuery = vi.mocked(searchDocsRag).mock.calls[0][0];

        expect(retrievalQuery).toBe(latestMessage);
    });

    it('keeps short, self-contained questions unchanged', async () => {
        const latestMessage = 'Where is /gamesaves?';
        const messages = [
            {
                role: 'user',
                content: 'Tell me about quests.',
            },
            {
                role: 'assistant',
                content: 'Quests guide you through tasks.',
            },
            {
                role: 'user',
                content: latestMessage,
            },
        ];

        await buildChatPrompt(messages, { forceDocsRag: true });

        const retrievalQuery = vi.mocked(searchDocsRag).mock.calls[0][0];

        expect(retrievalQuery).toBe(latestMessage);
    });

    it('uses compact named default docs RAG options for chat prompts', async () => {
        const messages = [{ role: 'user', content: 'Where is /docs/routes?' }];

        await buildChatPrompt(messages, { docsRagBudgetChars: 1000000 });

        const [, options] = vi.mocked(searchDocsRag).mock.calls[0];

        expect(CHAT_DOCS_RAG_DEFAULTS).toEqual(
            expect.objectContaining({
                maxResults: expect.any(Number),
                maxChars: expect.any(Number),
                maxExcerptChars: expect.any(Number),
                routeMaxExcerptChars: expect.any(Number),
            })
        );
        expect(CHAT_DOCS_RAG_DEFAULTS.maxResults).toBeLessThan(50);
        expect(CHAT_DOCS_RAG_DEFAULTS.maxChars).toBeLessThan(50000);
        expect(CHAT_DOCS_RAG_DEFAULTS.maxExcerptChars).toBeLessThan(8500);
        expect(CHAT_DOCS_RAG_PROMPT_BUDGET_CHARS).toBeLessThan(80000);
        expect(options).toEqual(expect.objectContaining(CHAT_DOCS_RAG_DEFAULTS));
    });

    it('preserves explicit docs RAG option overrides without a prompt budget override', async () => {
        const messages = [{ role: 'user', content: 'Where is /docs/routes?' }];

        await buildChatPrompt(messages, {
            docsRagOptions: { maxResults: 12, maxChars: 22000, maxExcerptChars: 3200 },
        });

        const [, options] = vi.mocked(searchDocsRag).mock.calls[0];

        expect(options).toEqual(
            expect.objectContaining({
                maxResults: 12,
                maxChars: 22000,
                maxExcerptChars: 3200,
            })
        );
    });

    it('preserves explicit docs RAG option overrides with a prompt budget override', async () => {
        const messages = [{ role: 'user', content: 'Where is /docs/routes?' }];

        await buildChatPrompt(messages, {
            docsRagBudgetChars: 1000000,
            docsRagOptions: { maxResults: 12, maxChars: 22000, maxExcerptChars: 3200 },
        });

        const [, options] = vi.mocked(searchDocsRag).mock.calls[0];

        expect(options).toEqual(
            expect.objectContaining({
                maxResults: 12,
                maxChars: 22000,
                maxExcerptChars: 3200,
            })
        );
    });

    it('clamps docs RAG maxChars when the prompt budget is exhausted', async () => {
        const messages = [{ role: 'user', content: 'Need docs.' }];

        await buildChatPrompt(messages, { docsRagBudgetChars: 0 });

        const [, options] = vi.mocked(searchDocsRag).mock.calls[0];

        expect(options.maxChars).toBe(0);
    });

    it('reserves bounded docs grounding for long route-intent full chats', async () => {
        vi.mocked(buildDchatKnowledgePack).mockReturnValueOnce({ summary: '', sources: [] });
        const docsText = `---
Docs grounding (gitSha: test):
- [doc] Backups — /docs/backups#top
  gamesave import steps
---`;
        vi.mocked(searchDocsRag).mockResolvedValueOnce({
            excerptsText: docsText,
            sources: [{ type: 'doc', id: 'backups', label: 'Backups', url: '/docs/backups#top' }],
            sourcesMeta: { results: [{ id: 'backups' }], renderedChars: docsText.length },
        });
        const longHistory = 'Earlier chat context. '.repeat(700);
        const messages = [
            { role: 'user', content: longHistory },
            { role: 'assistant', content: longHistory },
            { role: 'user', content: 'Where is /gamesaves?' },
        ];

        const payload = await buildChatPrompt(messages);
        const prompt = payload.combinedMessages.map((message) => message.content).join('\n');

        expect(payload.contextPlan.mode).toBe('full');
        expect(payload.contextPlan.includeDocsRag).toBe(true);
        expect(prompt).toContain('Docs grounding');
        expect(payload.contextSources.some((source) => source.type === 'doc')).toBe(true);

        const focusIndex = payload.combinedMessages.findIndex((message) =>
            message.content?.includes('Answer the final user message directly.')
        );
        const latestIndex = payload.combinedMessages.length - 1;
        const docsIndex = payload.combinedMessages.findIndex((message) =>
            message.content?.includes('Docs grounding')
        );

        expect(focusIndex).toBeGreaterThan(docsIndex);
        expect(focusIndex).toBe(latestIndex - 1);
        expect(payload.combinedMessages.at(-1)).toBe(messages.at(-1));

        expect(payload.contextPlan.docsRagRenderedChars).toBeLessThanOrEqual(
            payload.contextPlan.docsRagBudget.maxChars
        );
        expect(payload.contextPlan.docsRagBudget.maxChars).toBeGreaterThanOrEqual(
            CHAT_DOCS_RAG_MIN_GROUNDING_CHARS
        );
    });
});

describe('validateChatResponseText', () => {
    it('rewrites GitHub docs blob links to in-game /docs routes', () => {
        const result = validateChatResponseText(
            'See https://github.com/democratizedspace/dspace/blob/main/docs/ROUTES.md and ' +
                'https://github.com/democratizedspace/dspace/blob/main/frontend/src/pages/docs/md/v3-release-state.md.'
        );

        expect(result.wasSanitized).toBe(true);
        expect(result.text).toContain('/docs/routes');
        expect(result.text).toContain('/docs/v3-release-state');
        expect(result.text).not.toMatch(/\/blob\//i);
        expect(result.text).not.toMatch(/\/tree\//i);
    });

    it('strips GitHub blob links while keeping the response body intact', () => {
        const result = validateChatResponseText(
            'Reference ' +
                'https://github.com/democratizedspace/dspace/blob/main/docs/design/rag_discoverability.md ' +
                'but keep this sentence.'
        );

        expect(result.wasSanitized).toBe(true);
        expect(result.text).toContain('keep this sentence');
        expect(result.text).toContain('[link removed: use /docs routes]');
        expect(result.text).not.toMatch(/\/blob\//i);
    });

    it('sanitizes GitHub blob links even when context sources exist', () => {
        const result = validateChatResponseText(
            'See https://github.com/democratizedspace/dspace/blob/main/docs/ROUTES.md.',
            { contextSources: [{ type: 'doc', url: '/docs/routes' }] }
        );

        expect(result.wasSanitized).toBe(true);
        expect(result.text).toContain('/docs/routes');
    });
});

describe('describeOpenAIError', () => {
    it('returns a quota message when OpenAI rejects for insufficient credits', () => {
        const error = new Error(
            'You exceeded your current quota, please check your plan and billing details.'
        );
        error.status = 429;
        error.code = 'insufficient_quota';
        error.error = { message: error.message, type: 'insufficient_quota' };

        const result = describeOpenAIError(error);

        expect(result).toMatch(/out of credits/i);
        expect(result).toMatch(/openai/i);
    });

    it('returns an API key message for authentication failures', () => {
        const error = new Error('Incorrect API key provided');
        error.status = 401;

        const result = describeOpenAIError(error);

        expect(result).toMatch(/api key/i);
        expect(result).toMatch(/openai/i);
    });

    it('treats numeric status strings as server errors', () => {
        const error = new Error('internal server error');
        // @ts-expect-error testing string coercion
        error.status = '503';

        const result = describeOpenAIError(error);

        expect(result).toMatch(/unavailable/i);
    });

    it('falls back to the default message for unknown errors', () => {
        const result = describeOpenAIError(new Error('unexpected'));

        expect(result).toBe(defaultOpenAIErrorMessage);
    });
});

describe('getOpenAIErrorSummary', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('labels authentication failures as auth errors', () => {
        const error = new Error('Invalid API key');
        error.status = 401;

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('auth');
        expect(result.message).toMatch(/api key/i);
    });

    it('labels quota exhaustion as quota errors', () => {
        const error = new Error('You exceeded your current quota');
        error.status = 429;
        error.code = 'insufficient_quota';
        error.error = { type: 'insufficient_quota' };

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('quota');
        expect(result.message).toMatch(/out of credits/i);
    });

    it('labels rate limiting as rate limit errors', () => {
        const error = new Error('Rate limit exceeded');
        error.status = 429;

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('rate_limit');
        expect(result.message).toMatch(/rate limited/i);
    });

    it('labels model access failures as permission errors', () => {
        const error = new Error('The model does not exist');
        error.status = 404;
        error.code = 'model_not_found';

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('permission');
        expect(result.message).toMatch(/denied access/i);
    });

    it('labels server outages as server errors', () => {
        const error = new Error('Server error');
        error.status = 503;

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('server');
        expect(result.message).toMatch(/unavailable/i);
    });

    it('labels offline failures as network errors', () => {
        vi.stubGlobal('navigator', { onLine: false });
        const error = new Error('Failed to fetch');

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('network');
        expect(result.message).toMatch(/could not reach/i);
    });

    it('labels network errors when the error name indicates a network failure', () => {
        const error = new Error('Request failed');
        error.name = 'NetworkError';

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('network');
        expect(result.message).toMatch(/could not reach/i);
    });

    it('labels network errors when the message contains load failed', () => {
        const error = new Error('Load failed while fetching the resource.');

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('network');
        expect(result.message).toMatch(/could not reach/i);
    });

    it('labels network errors when the message contains networkerror', () => {
        const error = new Error('NetworkError when attempting to fetch resource.');

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('network');
        expect(result.message).toMatch(/could not reach/i);
    });

    it('labels empty TypeError failures as network errors', () => {
        const error = new Error('');
        error.name = 'TypeError';

        const result = getOpenAIErrorSummary(error);

        expect(result.type).toBe('network');
        expect(result.message).toMatch(/could not reach/i);
    });

    it('falls back to unknown for unexpected errors', () => {
        const result = getOpenAIErrorSummary(new Error('mystery'));

        expect(result.type).toBe('unknown');
        expect(result.message).toBe(defaultOpenAIErrorMessage);
    });
});
