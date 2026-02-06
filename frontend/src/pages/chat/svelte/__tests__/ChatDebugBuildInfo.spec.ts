import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import OpenAIChat from '../OpenAIChat.svelte';

vi.mock('../../../../generated/build_meta.json', () => ({
    default: {
        gitSha: 'feedbeefcafef00d',
        generatedAt: '2024-01-01T00:00:00.000Z',
        source: 'git',
    },
}));

const mockGetDocsRagMeta = vi.hoisted(() =>
    vi.fn(async () => ({
        gitSha: 'abc123',
        docsGitSha: 'abc123',
        generatedAt: 'just-now',
        envName: 'staging',
        sourceRef: 'refs/heads/main',
    }))
);
const mockGetDocsRagComparison = vi.hoisted(() =>
    vi.fn((appSha: string, docsSha: string) => ({
        status: 'match',
        message: '✅ in sync',
    }))
);
const mockGetDocsRagMismatchWarning = vi.hoisted(() => vi.fn(() => null));

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
    const originalLocation = window.location;
    const setHost = (url: string) => {
        Object.defineProperty(window, 'location', {
            value: new URL(url),
            writable: true,
        });
    };

    beforeEach(() => {
        setHost('https://localhost:3000/chat');
        mockGetDocsRagMeta.mockResolvedValue({
            gitSha: 'abc123',
            docsGitSha: 'abc123',
            generatedAt: 'just-now',
            envName: 'staging',
            sourceRef: 'refs/heads/main',
        });
        mockGetDocsRagComparison.mockImplementation((appSha: string, docsSha: string) => ({
            status: 'match',
            message: '✅ in sync',
        }));
        mockGetDocsRagMismatchWarning.mockReturnValue(null);
    });

    afterEach(() => {
        cleanup();
        delete process.env.VITE_GIT_SHA;
        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
        });
        vi.clearAllMocks();
        mockGetDocsRagMeta.mockReset();
        mockGetDocsRagComparison.mockReset();
        mockGetDocsRagMismatchWarning.mockReset();
    });

    it('shows non-empty build metadata from VITE_GIT_SHA', async () => {
        // Set process.env before import so the module reads the fallback path for VITE_GIT_SHA.
        process.env.VITE_GIT_SHA = 'abc123def456';
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

    it('derives env and uses build metadata when VITE SHA is missing', async () => {
        delete process.env.VITE_GIT_SHA;
        mockGetDocsRagMeta.mockResolvedValueOnce({
            gitSha: 'docs-only',
            docsGitSha: 'docs-only',
            generatedAt: 'just-now',
            envName: 'unknown',
            sourceRef: 'refs/heads/main',
        });

        render(OpenAIChat);

        const promptVersion = await screen.findByText('Prompt version: v3:feedbee');
        expect(promptVersion).toBeInTheDocument();

        const appBuildLabel = await screen.findByText('App build SHA');
        expect(appBuildLabel.nextElementSibling?.textContent).toContain('feedbeefcafef00d');

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        expect(appBuildSourceLabel.nextElementSibling?.textContent).toContain('vite');

        const docsDerivedEnvLabel = await screen.findByText('Docs env derived');
        expect(docsDerivedEnvLabel.nextElementSibling?.textContent).toContain('dev');
    });

    it('uses build metadata on a staging host when VITE SHA is missing', async () => {
        setHost('https://staging.democratized.space/chat');
        delete process.env.VITE_GIT_SHA;
        mockGetDocsRagMeta.mockResolvedValueOnce({
            gitSha: 'docs-only',
            docsGitSha: 'docs-only',
            generatedAt: 'just-now',
            envName: 'staging',
            sourceRef: 'refs/heads/main',
        });
        mockGetDocsRagComparison.mockImplementation(() => ({
            status: 'unverified',
            message: '⚠️ cannot verify app/docs sync (app SHA missing)',
        }));

        render(OpenAIChat);

        const appBuildLabel = await screen.findByText('App build SHA');
        expect(appBuildLabel.nextElementSibling?.textContent).toContain('feedbeefcafef00d');

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        expect(appBuildSourceLabel.nextElementSibling?.textContent).toContain('vite');

        const comparisonLabel = await screen.findByText('Docs RAG comparison');
        const comparisonRow = comparisonLabel.closest('.debug-meta-row');
        expect(comparisonRow?.textContent).toContain('⚠️ cannot verify app/docs sync');
        await waitFor(() => {
            expect(mockGetDocsRagComparison).toHaveBeenCalledWith('feedbeefcafef00d', 'docs-only');
        });
    });

    it('shows in sync when app SHA matches docs on a prod host', async () => {
        setHost('https://democratized.space/chat');
        process.env.VITE_GIT_SHA = 'abc123def456';
        mockGetDocsRagMeta.mockResolvedValueOnce({
            gitSha: 'abc123def456',
            docsGitSha: 'abc123def456',
            generatedAt: 'just-now',
            envName: 'prod',
            sourceRef: 'refs/heads/main',
        });
        mockGetDocsRagComparison.mockImplementation((appSha: string, docsSha: string) => ({
            status: 'match',
            message: '✅ in sync',
        }));

        render(OpenAIChat);

        const appBuildLabel = await screen.findByText('App build SHA');
        expect(appBuildLabel.nextElementSibling?.textContent).toContain('abc123def456');

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        expect(appBuildSourceLabel.nextElementSibling?.textContent).toContain('vite');

        const comparisonLabel = await screen.findByText('Docs RAG comparison');
        const comparisonRow = comparisonLabel.closest('.debug-meta-row');
        expect(comparisonRow?.textContent).toContain('✅ in sync');
    });
});
