import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';

vi.mock('../../../../utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({
        settings: {
            showChatDebugPayload: true,
        },
    })),
    ready: Promise.resolve(),
    state: {
        subscribe: (handler: (state: { settings: { showChatDebugPayload: boolean } }) => void) => {
            handler({
                settings: {
                    showChatDebugPayload: true,
                },
            });
            return () => {};
        },
    },
}));

vi.mock('../../../../utils/docsRag.js', () => ({
    getDocsRagMeta: vi.fn(async () => ({
        gitSha: 'abc123',
        generatedAt: 'just-now',
    })),
    getDocsRagComparison: vi.fn(() => ({
        status: 'match',
        message: '✅ in sync',
    })),
}));

describe('OpenAIChat build metadata', () => {
    afterEach(() => {
        delete process.env.VITE_GIT_SHA;
    });

    it('shows the build SHA and prompt version from VITE_GIT_SHA', async () => {
        // Set process.env before import so the module reads the fallback path for VITE_GIT_SHA.
        process.env.VITE_GIT_SHA = 'abc123';
        const { default: OpenAIChat } = await import('../OpenAIChat.svelte');
        render(OpenAIChat);

        const promptVersion = await screen.findByText('Prompt version: v3:abc123');
        expect(promptVersion).toBeInTheDocument();

        const appBuildLabel = await screen.findByText('App build SHA');
        expect(appBuildLabel.nextElementSibling).toHaveTextContent('abc123');
    });

    it('renders non-empty debug metadata fields', async () => {
        process.env.VITE_GIT_SHA = 'abc123';
        const { default: OpenAIChat } = await import('../OpenAIChat.svelte');
        render(OpenAIChat);

        const promptVersion = await screen.findByText(/Prompt version:/);
        expect(promptVersion).toHaveTextContent(/Prompt version: v3:\S+/);

        const appBuildLabel = await screen.findByText('App build SHA');
        expect(appBuildLabel.nextElementSibling?.textContent).toBeTruthy();

        const docsShaLabel = await screen.findByText('Docs RAG SHA');
        expect(docsShaLabel.nextElementSibling?.textContent).toBeTruthy();

        const docsGeneratedLabel = await screen.findByText('Docs RAG generatedAt');
        expect(docsGeneratedLabel.nextElementSibling?.textContent).toBeTruthy();
    });
});
