import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/svelte';

vi.mock('svelte', async () => {
    const actual = await vi.importActual('svelte');
    return {
        ...(actual as Record<string, unknown>),
        effect: (fn?: () => void) => {
            if (fn) {
                fn();
            }
            return () => {};
        },
        onMount: (fn?: () => void) => {
            if (fn) {
                fn();
            }
            return () => {};
        },
    };
});

vi.mock('svelte/internal/client', async () => {
    const actual = await vi.importActual('svelte/internal/client');
    return {
        ...(actual as Record<string, unknown>),
        effect: (fn?: () => void) => {
            if (fn) {
                fn();
            }
            return () => {};
        },
        effect_root: (fn?: () => void) => {
            if (fn) {
                fn();
            }
            return () => {};
        },
        pre_effect: (fn?: () => void) => {
            if (fn) {
                fn();
            }
        },
        legacy_pre_effect_reset: () => {},
    };
});

const mockGetDocsRagMeta = vi.fn(async () => ({
    gitSha: 'abc123',
    docsGitSha: 'abc123',
    generatedAt: 'just-now',
    envName: 'staging',
    sourceRef: 'refs/heads/main',
}));
const mockGetDocsRagComparison = vi.fn((appSha: string, docsSha: string) => ({
    status: 'match',
    message: `✅ in sync (app: ${appSha}, docs: ${docsSha})`,
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
            message: `✅ in sync (app: ${appSha}, docs: ${docsSha})`,
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
        vi.resetModules();
        vi.clearAllMocks();
        mockGetDocsRagMeta.mockReset();
        mockGetDocsRagComparison.mockReset();
        mockGetDocsRagMismatchWarning.mockReset();
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
        expect(appBuildSourceLabel.nextElementSibling).toHaveTextContent(
            'docs-pack-fallback (dev)'
        );

        const docsDerivedEnvLabel = await screen.findByText('Docs env derived');
        expect(docsDerivedEnvLabel.nextElementSibling).toHaveTextContent('dev');
    });

    it('warns when app SHA is missing on a staging host', async () => {
        setHost('https://staging.democratized.space/chat');
        delete process.env.VITE_GIT_SHA;
        mockGetDocsRagMeta.mockResolvedValueOnce({
            gitSha: 'docs-only',
            docsGitSha: 'docs-only',
            generatedAt: 'just-now',
            envName: 'staging',
            sourceRef: 'refs/heads/main',
        });
        mockGetDocsRagComparison.mockImplementation((appSha: string, docsSha: string) => ({
            status: 'assumed',
            message: `⚠️ assumed (app: ${appSha}, docs: ${docsSha})`,
        }));

        const { default: OpenAIChat } = await import('../OpenAIChat.svelte');
        render(OpenAIChat);

        const appBuildLabel = await screen.findByText('App build SHA');
        expect(appBuildLabel.nextElementSibling).toHaveTextContent('missing');

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        expect(appBuildSourceLabel.nextElementSibling).toHaveTextContent('missing');

        const comparisonLabel = await screen.findByText('Docs RAG comparison');
        expect(comparisonLabel.nextElementSibling).toHaveTextContent(
            '⚠️ cannot verify app/docs sync (app SHA missing)'
        );
        expect(mockGetDocsRagComparison).toHaveBeenCalledWith('missing', 'docs-only');
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
            message: `✅ in sync (app: ${appSha}, docs: ${docsSha})`,
        }));

        const { default: OpenAIChat } = await import('../OpenAIChat.svelte');
        render(OpenAIChat);

        const appBuildLabel = await screen.findByText('App build SHA');
        expect(appBuildLabel.nextElementSibling).toHaveTextContent('abc123def456');

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        expect(appBuildSourceLabel.nextElementSibling).toHaveTextContent('vite');

        const comparisonLabel = await screen.findByText('Docs RAG comparison');
        expect(comparisonLabel.nextElementSibling).toHaveTextContent(
            '✅ in sync (app: abc123def456, docs: abc123def456)'
        );
    });
});
