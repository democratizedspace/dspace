import { describe, expect, it, vi } from 'vitest';

vi.mock('../frontend/src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({})),
    ready: Promise.resolve(),
}));

vi.mock('../frontend/src/utils/dchatKnowledge.js', () => ({
    buildDchatKnowledgePack: vi.fn(() => ({ summary: '', sources: [] })),
}));

vi.mock('../frontend/src/utils/docsRag.js', () => ({
    searchDocsRag: vi.fn(async () => ({ excerptsText: '', sources: [] })),
}));

describe('chat prompt version stamp', () => {
    it('includes the prompt version header and guardrail lines', async () => {
        const { buildChatPrompt, CHAT_PROMPT_VERSION } = await import(
            '../frontend/src/utils/openAI.js'
        );
        const payload = await buildChatPrompt([]);
        const systemMessage = payload.combinedMessages.find((message) => message.role === 'system');

        expect(systemMessage?.content).toContain('Prompt version:');
        expect(systemMessage?.content).toContain(`Prompt version: ${CHAT_PROMPT_VERSION}`);
        expect(systemMessage?.content).toContain(
            'Never invent quests, items, processes, routes, URLs, or player state.'
        );
        expect(systemMessage?.content).toContain('/gamesaves');
        expect(systemMessage?.content).toContain('docs/ROUTES.md');
    });
});
