import { describe, expect, it, vi } from 'vitest';

vi.mock('../frontend/src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({})),
    ready: Promise.resolve(),
}));

describe('chat prompt version stamp', () => {
    it('adds a prompt version header and guardrails to the system prompt', async () => {
        const { buildChatPrompt } = await import('../frontend/src/utils/openAI.js');

        const promptPayload = await buildChatPrompt([]);
        const systemMessage = promptPayload.combinedMessages[0];
        expect(systemMessage?.role).toBe('system');
        expect(systemMessage?.content).toContain('Prompt version:');
        expect(systemMessage?.content).toContain('Never invent quests, items, processes, routes');
        expect(systemMessage?.content).toContain('/gamesaves');
        expect(systemMessage?.content).toContain('docs/ROUTES.md');
    });
});
