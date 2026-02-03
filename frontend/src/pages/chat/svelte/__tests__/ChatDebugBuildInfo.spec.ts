import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/svelte';

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
        gitSha: 'docs789',
        generatedAt: 'just-now',
    })),
    getDocsRagComparison: vi.fn(() => ({
        status: 'match',
        message: '✅ in sync (app: abc123def456, docs: docs789)',
    })),
}));

describe('OpenAIChat build metadata', () => {
    afterEach(() => {
        cleanup();
        delete process.env.VITE_GIT_SHA;
    });

    it('shows non-empty build metadata from VITE_GIT_SHA', async () => {
        // Set process.env before import so the module reads the fallback path for VITE_GIT_SHA.
        process.env.VITE_GIT_SHA = 'abc123def456';
        const { default: OpenAIChat } = await import('../OpenAIChat.svelte');
        render(OpenAIChat);

        const promptVersion = await screen.findByText('Prompt version: v3:abc123d');
        expect(promptVersion).toBeInTheDocument();
        expect(promptVersion).not.toHaveTextContent('unknown');

        const appBuildLabel = await screen.findByText('App build SHA');
        expect(appBuildLabel.nextElementSibling).toHaveTextContent('abc123def456');
        expect(appBuildLabel.nextElementSibling).not.toHaveTextContent('unknown');

        const docsShaLabel = await screen.findByText('Docs RAG SHA');
        expect(docsShaLabel.nextElementSibling).toHaveTextContent('docs789');

        const docsGeneratedLabel = await screen.findByText('Docs RAG generatedAt');
        expect(docsGeneratedLabel.nextElementSibling).toHaveTextContent('just-now');

        const comparisonLabel = await screen.findByText('Docs RAG comparison');
        expect(comparisonLabel.nextElementSibling).toHaveTextContent('✅ in sync');
    });
});
