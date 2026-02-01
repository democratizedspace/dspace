import { describe, expect, it, vi } from 'vitest';

const loadGameStateMock = vi.fn();

vi.mock('../frontend/src/utils/gameState/common.js', () => ({
    loadGameState: loadGameStateMock,
    ready: Promise.resolve(),
}));

vi.mock('../frontend/src/utils/dchatKnowledge.js', () => ({
    buildDchatKnowledge: vi.fn(),
    buildDchatKnowledgePack: vi.fn(() => ({ summary: null, sources: [] })),
}));

vi.mock('../frontend/src/utils/docsRag.js', () => ({
    searchDocsRag: vi.fn(async () => ({ excerptsText: '', sources: [] })),
}));

describe('chat prompt version stamping', () => {
    it('prepends a version stamp and guardrails to the system prompt', async () => {
        loadGameStateMock.mockReturnValue({});

        const { buildChatPrompt } = await import('../frontend/src/utils/openAI.js');
        const promptPayload = await buildChatPrompt([]);
        const systemMessage = promptPayload.combinedMessages[0];

        expect(systemMessage.role).toBe('system');
        expect(systemMessage.content).toContain('Prompt version:');
        expect(systemMessage.content).toContain(
            'Never invent quests, items, processes, routes, URLs, or player state.'
        );
        expect(systemMessage.content).toContain('Please export/paste a save from /gamesaves');
        expect(systemMessage.content).toContain(
            'When giving URLs/navigation, cite /docs excerpts or docs/ROUTES.md.'
        );
    });
});
