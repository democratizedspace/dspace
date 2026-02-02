import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({
        openAI: {},
    })),
    ready: Promise.resolve(),
}));

vi.mock('../src/utils/dchatKnowledge.js', () => ({
    buildDchatKnowledge: vi.fn(() => 'knowledge'),
    buildDchatKnowledgePack: vi.fn(() => ({ summary: '', sources: [] })),
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

describe('prompt version stamping', () => {
    afterEach(() => {
        delete process.env.VITE_GIT_SHA;
        vi.resetModules();
    });

    it('stamps the system prompt with the build SHA when available', async () => {
        process.env.VITE_GIT_SHA = 'abc123';
        vi.resetModules();

        const { buildChatPrompt, CHAT_PROMPT_VERSION } = await import('../src/utils/openAI.js');
        const { debugMessages } = await buildChatPrompt([]);

        expect(CHAT_PROMPT_VERSION).toBe('v3:abc123');
        const systemMessage = debugMessages.find((message) => message.role === 'system');
        expect(systemMessage?.content).toContain('Prompt version: v3:abc123');
        expect(systemMessage?.content).not.toContain('Prompt version: v3:dev');
    });
});
