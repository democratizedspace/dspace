/** @jest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({
        settings: {
            showChatDebugPayload: true,
        },
    })),
    ready: Promise.resolve(),
    state: {
        subscribe: (handler) => {
            handler({
                settings: {
                    showChatDebugPayload: true,
                },
            });
            return () => {};
        },
    },
}));

vi.mock('../src/utils/docsRag.js', () => ({
    getDocsRagMeta: vi.fn(async () => ({
        gitSha: 'abc123',
        generatedAt: 'just-now',
    })),
    getDocsRagComparison: vi.fn(() => ({
        status: 'match',
        message: 'Docs RAG matches app build.',
    })),
}));

describe('OpenAIChat build metadata', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('shows the build SHA and prompt version from VITE_GIT_SHA', async () => {
        vi.stubEnv('VITE_GIT_SHA', 'abc123');
        // Ensure module cache is cleared so the stubbed env is read on import.
        // This also exercises the process.env fallback path since import.meta.env is static.
        vi.resetModules();
        const { default: OpenAIChat } = await import('../src/pages/chat/svelte/OpenAIChat.svelte');
        render(OpenAIChat);

        const promptVersion = await screen.findByText('Prompt version: v3:abc123');
        expect(promptVersion).toBeInTheDocument();

        const appBuildLabel = await screen.findByText('App build SHA');
        expect(appBuildLabel.nextElementSibling).toHaveTextContent('abc123');
    });
});
