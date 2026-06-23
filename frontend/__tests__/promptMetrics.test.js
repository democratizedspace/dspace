import { describe, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createPromptMetrics } from '../src/utils/promptMetrics.js';

const mockedState = {
    quests: { 'welcome/howtodoquests': { stepId: 2 } },
    inventory: { '58580f6f-f3be-4be0-80b9-f6f8bf0b05a6': 2 },
};

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => mockedState),
    ready: Promise.resolve(),
}));

vi.mock('../src/utils/docsRag.js', () => ({
    searchDocsRag: vi.fn(async () => ({ excerptsText: '', sources: [] })),
}));

const secretLikePatterns = [
    /sk-[A-Za-z0-9_-]{20,}/,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /password\s*[:=]/i,
    /api[_-]?key\s*[:=]/i,
];

describe('privacy-safe prompt metrics', () => {
    test('does not return prompt content strings', () => {
        const metrics = createPromptMetrics(
            {
                combinedMessages: [
                    { role: 'system', content: 'SECRET SYSTEM CONTENT' },
                    { role: 'user', content: 'SECRET USER CONTENT' },
                ],
            },
            { components: [{ index: 0, component: 'systemInstructions' }] }
        );

        expect(JSON.stringify(metrics)).not.toContain('SECRET');
        expect(metrics.perMessage[0]).toEqual({
            index: 0,
            role: 'system',
            component: 'systemInstructions',
            characters: 21,
            utf8Bytes: 21,
        });
    });

    test('counts UTF-8 bytes separately from JavaScript characters', () => {
        const metrics = createPromptMetrics({
            combinedMessages: [{ role: 'user', content: 'a🚀é' }],
        });

        expect(metrics.totalCharacters).toBe(4);
        expect(metrics.totalUtf8Bytes).toBe(7);
        expect(metrics.perMessage[0].utf8Bytes).toBe(7);
    });

    test('component accounting is deterministic', () => {
        const payload = {
            combinedMessages: [
                { role: 'system', content: 'system' },
                { role: 'system', content: 'rag text' },
                { role: 'system', content: 'player' },
                { role: 'assistant', content: 'history' },
                { role: 'user', content: 'latest' },
            ],
        };
        const metadata = {
            components: [
                { index: 0, component: 'systemInstructions' },
                { index: 1, component: 'rag' },
                { index: 2, component: 'playerState' },
                { index: 3, component: 'chatHistory' },
                { index: 4, component: 'latestUserMessage' },
            ],
            promptBuildDurationMs: 12,
            ragDurationMs: 3,
        };

        expect(createPromptMetrics(payload, metadata)).toEqual(
            createPromptMetrics(payload, metadata)
        );
        const metrics = createPromptMetrics(payload, metadata);
        expect(metrics.componentTotals).toMatchObject({
            systemInstructions: { messages: 1, characters: 6, utf8Bytes: 6 },
            rag: { messages: 1, characters: 8, utf8Bytes: 8 },
            playerState: { messages: 1, characters: 6, utf8Bytes: 6 },
            chatHistory: { messages: 1, characters: 7, utf8Bytes: 7 },
            latestUserMessage: { messages: 1, characters: 6, utf8Bytes: 6 },
        });
        expect(metrics.timingsMs).toEqual({ promptBuild: 12, rag: 3 });
    });

    test('buildChatPrompt omits metrics unless instrumentation is explicitly enabled', async () => {
        const { buildChatPrompt } = await import('../src/utils/openAI.js');
        const plainPayload = await buildChatPrompt([{ role: 'user', content: 'hello' }]);
        const instrumentedPayload = await buildChatPrompt([{ role: 'user', content: 'hello' }], {
            includePromptMetrics: true,
        });

        expect(plainPayload).not.toHaveProperty('promptMetrics');
        expect(Object.keys(plainPayload).sort()).toEqual(
            [
                'combinedMessages',
                'contextSources',
                'debugMessages',
                'gameState',
                'playerStateSummary',
            ].sort()
        );
        expect(instrumentedPayload.promptMetrics).toEqual(
            expect.objectContaining({
                messageCount: instrumentedPayload.combinedMessages.length,
                totalCharacters: expect.any(Number),
                totalUtf8Bytes: expect.any(Number),
            })
        );
        expect(JSON.stringify(instrumentedPayload.promptMetrics)).not.toContain('hello');
    }, 15000);

    test('benchmark script uses synthetic text and no secret-looking fixtures', () => {
        const script = readFileSync('../scripts/benchmark-token-place-context.mjs', 'utf8');
        expect(script).toContain('Synthetic');
        for (const pattern of secretLikePatterns) {
            expect(script).not.toMatch(pattern);
        }
    });
});
