import { describe, expect, it, vi } from 'vitest';

const ORIGINAL_VITE_GIT_SHA = process.env.VITE_GIT_SHA;

process.env.VITE_GIT_SHA = 'unit-test-sha';

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
        vi.resetModules();
        const { buildChatPrompt, CHAT_PROMPT_VERSION } = await import(
            '../frontend/src/utils/openAI.js'
        );
        const payload = await buildChatPrompt([]);
        const systemMessage = payload.combinedMessages.find((message) => message.role === 'system');

        expect(systemMessage).toBeDefined();
        if (!systemMessage) {
            throw new Error('Expected system message to be defined.');
        }

        expect(systemMessage.content).toContain('Prompt version:');
        expect(systemMessage.content).toContain(`Prompt version: ${CHAT_PROMPT_VERSION}`);
        expect(systemMessage.content).toContain('Prompt version: v3:unit-test-sha');
        expect(systemMessage.content).toContain('/gamesaves');
        expect(systemMessage.content).toContain('docs/ROUTES.md');
    });
});

process.env.VITE_GIT_SHA = ORIGINAL_VITE_GIT_SHA;
