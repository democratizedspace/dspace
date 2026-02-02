import { afterEach, describe, expect, it, vi } from 'vitest';

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
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('includes the prompt version header and guardrail lines', async () => {
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
        expect(systemMessage.content).toContain('/gamesaves');
        expect(systemMessage.content).toContain('docs/ROUTES.md');
    });

    it('stamps prompt version with the build SHA when available', async () => {
        vi.stubEnv('VITE_GIT_SHA', 'feedface');
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

        expect(CHAT_PROMPT_VERSION).toBe('v3:feedface');
        expect(systemMessage.content).toContain('Prompt version: v3:feedface');
    });

    it('does not allow production builds to emit v3:dev', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        vi.resetModules();
        const { CHAT_PROMPT_VERSION } = await import('../frontend/src/utils/openAI.js');

        expect(CHAT_PROMPT_VERSION).not.toBe('v3:dev');
    });
});
