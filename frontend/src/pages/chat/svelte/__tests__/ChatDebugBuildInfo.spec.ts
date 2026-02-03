import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/svelte';

const mockGetDocsRagMeta = vi.fn(async () => ({
    gitSha: 'abc123',
    docsGitSha: 'abc123',
    generatedAt: 'just-now',
    envName: 'staging',
    sourceRef: 'refs/heads/main',
}));
const mockGetDocsRagComparison = vi.fn(() => ({
    status: 'match',
    message: '✅ in sync (app: abc123def456, docs: docs789)',
}));
const mockGetDocsRagMismatchWarning = vi.fn(() => null);

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
    getDocsRagMeta: mockGetDocsRagMeta,
    getDocsRagComparison: mockGetDocsRagComparison,
    getDocsRagMismatchWarning: mockGetDocsRagMismatchWarning,
}));

describe('OpenAIChat build metadata', () => {
    beforeEach(() => {
        mockGetDocsRagMeta.mockResolvedValue({
            gitSha: 'abc123',
            docsGitSha: 'abc123',
            generatedAt: 'just-now',
            envName: 'staging',
            sourceRef: 'refs/heads/main',
        });
        mockGetDocsRagComparison.mockReturnValue({
            status: 'match',
            message: '✅ in sync (app: abc123def456, docs: docs789)',
        });
        mockGetDocsRagMismatchWarning.mockReturnValue(null);
    });

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

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        expect(appBuildSourceLabel.nextElementSibling).toHaveTextContent('vite');

        const docsShaLabel = await screen.findByText('Docs RAG SHA');
        expect(docsShaLabel.nextElementSibling).toHaveTextContent('abc123');

        const docsEnvLabel = await screen.findByText('Docs pack env');
        expect(docsEnvLabel.nextElementSibling).toHaveTextContent('staging');

        const docsDerivedEnvLabel = await screen.findByText('Docs env derived');
        expect(docsDerivedEnvLabel.nextElementSibling).toHaveTextContent('n/a');

        const docsHostLabel = await screen.findByText('Docs host');
        expect(docsHostLabel.nextElementSibling).toHaveTextContent(window.location.host);

        const docsSourceRefLabel = await screen.findByText('Docs pack sourceRef');
        expect(docsSourceRefLabel.nextElementSibling).toHaveTextContent('refs/heads/main');
    });

    it('derives env and uses docs pack SHA when app SHA is missing', async () => {
        delete process.env.VITE_GIT_SHA;
        mockGetDocsRagMeta.mockResolvedValueOnce({
            gitSha: 'docs-only',
            docsGitSha: 'docs-only',
            generatedAt: 'just-now',
            envName: 'unknown',
            sourceRef: 'refs/heads/main',
        });

        const { default: OpenAIChat } = await import('../OpenAIChat.svelte');
        render(OpenAIChat);

        const promptVersion = await screen.findByText('Prompt version: v3:docs-on');
        expect(promptVersion).toBeInTheDocument();

        const appBuildLabel = await screen.findByText('App build SHA');
        expect(appBuildLabel.nextElementSibling).toHaveTextContent('docs-only');

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        expect(appBuildSourceLabel.nextElementSibling).toHaveTextContent('docs-pack-fallback');

        const docsDerivedEnvLabel = await screen.findByText('Docs env derived');
        expect(docsDerivedEnvLabel.nextElementSibling).toHaveTextContent('dev');
    });
});
