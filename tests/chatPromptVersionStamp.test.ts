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

vi.mock('../frontend/src/generated/build_meta.json', () => ({
    default: {
        gitSha: 'feedbeefcafef00d',
        generatedAt: '2024-01-01T00:00:00.000Z',
        source: 'git',
    },
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

        expect(CHAT_PROMPT_VERSION).toBe('v3:feedfac');
        expect(systemMessage.content).toContain('Prompt version: v3:feedfac');
    });

    it('emits build metadata when no VITE build SHA is provided', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        vi.stubEnv('VITE_GIT_SHA', '');
        vi.resetModules();
        const { CHAT_PROMPT_VERSION } = await import('../frontend/src/utils/openAI.js');

        expect(CHAT_PROMPT_VERSION).toBe('v3:feedbee');
    });

    it('does not emit v3:missing in system messages', async () => {
        const { buildChatPrompt } = await import('../frontend/src/utils/openAI.js');
        const payload = await buildChatPrompt([]);
        const systemMessage = payload.combinedMessages.find((message) => message.role === 'system');

        expect(systemMessage).toBeDefined();
        if (!systemMessage) {
            throw new Error('Expected system message to be defined.');
        }

        expect(systemMessage.content).not.toContain('v3:missing');
    });
});
