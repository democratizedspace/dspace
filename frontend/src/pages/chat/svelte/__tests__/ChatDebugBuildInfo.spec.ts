import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { getDocsRagComparison, getDocsRagMeta } from '../../../../utils/docsRag.js';

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
        message: 'Docs RAG matches app build.',
    })),
}));

const mockedGetDocsRagComparison = vi.mocked(getDocsRagComparison);
const mockedGetDocsRagMeta = vi.mocked(getDocsRagMeta);

const renderChat = async () => {
    const { default: OpenAIChat } = await import('../OpenAIChat.svelte');
    render(OpenAIChat);
};

describe('OpenAIChat build metadata', () => {
    afterEach(() => {
        delete process.env.VITE_GIT_SHA;
    });

    beforeEach(() => {
        mockedGetDocsRagComparison.mockReset();
        mockedGetDocsRagMeta.mockReset();
        mockedGetDocsRagMeta.mockResolvedValue({
            gitSha: 'abc123',
            generatedAt: 'just-now',
        });
        mockedGetDocsRagComparison.mockReturnValue({
            status: 'match',
            message: 'Docs RAG matches app build.',
        });
    });

    it('shows the build SHA and prompt version from VITE_GIT_SHA', async () => {
        // Set process.env before import so the module reads the fallback path for VITE_GIT_SHA.
        process.env.VITE_GIT_SHA = 'abc123';
        await renderChat();

        const promptVersion = await screen.findByText('Prompt version: v3:abc123');
        expect(promptVersion).toBeInTheDocument();

        const appBuildLabel = await screen.findByText('App build SHA');
        expect(appBuildLabel.nextElementSibling).toHaveTextContent('abc123');
    });

    it('shows unavailable when the app build SHA is missing', async () => {
        process.env.VITE_GIT_SHA = 'unknown';
        mockedGetDocsRagComparison.mockReturnValueOnce({
            status: 'unavailable',
            message: 'App build SHA unavailable; cannot compare.',
        });

        await renderChat();

        const comparisonLabel = await screen.findByText('Docs RAG comparison');
        expect(comparisonLabel.nextElementSibling).toHaveTextContent(
            'App build SHA unavailable; cannot compare.'
        );
    });

    it('shows match when docs RAG and app SHAs align', async () => {
        process.env.VITE_GIT_SHA = 'abc123';
        mockedGetDocsRagComparison.mockReturnValueOnce({
            status: 'match',
            message: 'Docs RAG matches app build.',
        });

        await renderChat();

        const comparisonLabel = await screen.findByText('Docs RAG comparison');
        expect(comparisonLabel.nextElementSibling).toHaveTextContent(
            'Docs RAG matches app build.'
        );
    });

    it('shows stale when docs RAG and app SHAs differ', async () => {
        process.env.VITE_GIT_SHA = 'abc123';
        mockedGetDocsRagComparison.mockReturnValueOnce({
            status: 'stale',
            message: 'Docs RAG is stale vs app build.',
        });

        await renderChat();

        const comparisonLabel = await screen.findByText('Docs RAG comparison');
        expect(comparisonLabel.nextElementSibling).toHaveTextContent(
            'Docs RAG is stale vs app build.'
        );
        expect(screen.getByRole('alert')).toHaveTextContent('Docs RAG is stale vs app build.');
    });
});
