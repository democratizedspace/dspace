import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import OpenAIChat from '../OpenAIChat.svelte';

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
const mockLoadGameState = vi.hoisted(() =>
    vi.fn(() => ({
        settings: {
            showChatDebugPayload: true,
        },
        quests: {},
        inventory: {},
        processes: {},
        versionNumberString: '3',
    }))
);
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock('../../../../utils/gameState/common.js', () => ({
    loadGameState: mockLoadGameState,
    ready: Promise.resolve(),
    state: {
        subscribe: (handler: (state: { settings: { showChatDebugPayload: boolean } }) => void) => {
            handler(mockLoadGameState());
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
    const originalFetch = global.fetch;
    const setHost = (url: string) => {
        Object.defineProperty(window, 'location', {
            value: new URL(url),
            writable: true,
        });
    };

    beforeEach(() => {
        global.fetch = mockFetch as typeof fetch;
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
        mockFetch.mockResolvedValue(
            new Response(
                JSON.stringify({
                    gitSha: 'runtime-sha',
                    source: 'ci',
                    generatedAt: 'now',
                }),
                { status: 200 }
            )
        );
    });

    afterEach(() => {
        cleanup();
        delete process.env.VITE_GIT_SHA;
        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
        });
        global.fetch = originalFetch;
        vi.clearAllMocks();
        mockGetDocsRagMeta.mockReset();
        mockGetDocsRagComparison.mockReset();
        mockGetDocsRagMismatchWarning.mockReset();
        mockLoadGameState.mockClear();
        mockFetch.mockReset();
    });

    it('shows non-empty build metadata from VITE_GIT_SHA', async () => {
        // Set process.env before import so the module reads the fallback path for VITE_GIT_SHA.
        process.env.VITE_GIT_SHA = 'abc123def456';
        render(OpenAIChat);

        const promptVersion = await screen.findByText('Prompt version: v3:abc123d');
        expect(promptVersion).toBeInTheDocument();
        expect(promptVersion).not.toHaveTextContent('unknown');

        const appBuildLabel = await screen.findByText('App build SHA');
        await waitFor(() => {
            expect(appBuildLabel.nextElementSibling).toHaveTextContent('abc123def456');
        });

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        await waitFor(() => {
            expect(appBuildSourceLabel.nextElementSibling).toHaveTextContent('vite');
        });

        const docsShaLabel = await screen.findByText('Docs RAG SHA');
        await waitFor(() => {
            expect(docsShaLabel.nextElementSibling).toHaveTextContent('abc123');
        });

        const docsEnvLabel = await screen.findByText('Docs pack env');
        await waitFor(() => {
            expect(docsEnvLabel.nextElementSibling).toHaveTextContent('staging');
        });

        const docsDerivedEnvLabel = await screen.findByText('Docs env derived');
        await waitFor(() => {
            expect(docsDerivedEnvLabel.nextElementSibling).toHaveTextContent('n/a');
        });

        const docsHostLabel = await screen.findByText('Docs host');
        await waitFor(() => {
            expect(docsHostLabel.nextElementSibling).toHaveTextContent(window.location.host);
        });

        const docsSourceRefLabel = await screen.findByText('Docs pack sourceRef');
        await waitFor(() => {
            expect(docsSourceRefLabel.nextElementSibling).toHaveTextContent('refs/heads/main');
        });
    });

    it('derives env when docs pack env is unknown', async () => {
        delete process.env.VITE_GIT_SHA;
        mockGetDocsRagMeta.mockResolvedValueOnce({
            gitSha: 'docs-only',
            docsGitSha: 'docs-only',
            generatedAt: 'just-now',
            envName: 'unknown',
            sourceRef: 'refs/heads/main',
        });

        render(OpenAIChat);

        await waitFor(() => {
            expect(screen.getByText(/Prompt version: v3:/)).toBeInTheDocument();
        });

        const appBuildLabel = await screen.findByText('App build SHA');
        await waitFor(() => {
            expect(appBuildLabel.nextElementSibling?.textContent).not.toContain('missing');
        });

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        await waitFor(() => {
            expect(appBuildSourceLabel.nextElementSibling?.textContent).not.toContain('missing');
        });

        const docsDerivedEnvLabel = await screen.findByText('Docs env derived');
        await waitFor(() => {
            expect(docsDerivedEnvLabel.nextElementSibling?.textContent).toContain('dev');
        });
    });

    it('prefers runtime or build metadata on a staging host', async () => {
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
            status: 'mismatch',
            message: `⚠️ mismatch (app: ${appSha.slice(0, 7)}, docs: ${docsSha.slice(0, 7)})`,
        }));
        mockFetch.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    gitSha: 'runtime-fix',
                    source: 'ci',
                    generatedAt: 'now',
                }),
                { status: 200 }
            )
        );

        render(OpenAIChat);

        const appBuildLabel = await screen.findByText('App build SHA');
        await waitFor(() => {
            expect(appBuildLabel.nextElementSibling?.textContent).not.toContain('missing');
        });

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        await waitFor(() => {
            expect(appBuildSourceLabel.nextElementSibling?.textContent).not.toContain('missing');
        });

        const comparisonLabel = await screen.findByText('Docs RAG comparison');
        const comparisonRow = comparisonLabel.closest('.debug-meta-row');
        await waitFor(() => {
            expect(comparisonRow?.textContent).toContain('⚠️ mismatch');
        });
        await waitFor(() => {
            expect(mockGetDocsRagComparison).toHaveBeenCalledWith(
                expect.stringMatching(/\w+/),
                'docs-only'
            );
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
        await waitFor(() => {
            expect(appBuildLabel.nextElementSibling?.textContent).toContain('abc123def456');
        });

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        await waitFor(() => {
            expect(appBuildSourceLabel.nextElementSibling?.textContent).toContain('vite');
        });

        const comparisonLabel = await screen.findByText('Docs RAG comparison');
        const comparisonRow = comparisonLabel.closest('.debug-meta-row');
        await waitFor(() => {
            expect(comparisonRow?.textContent).toContain('✅ in sync');
        });
    });

    it('copies debug info with non-empty SHAs', async () => {
        process.env.VITE_GIT_SHA = 'abc123def456';
        const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        });

        try {
            render(OpenAIChat);

            const copyButton = await screen.findByRole('button', { name: 'Copy debug info' });
            await waitFor(() => {
                const appBuildLabel = screen.getByText('App build SHA');
                expect(appBuildLabel.nextElementSibling?.textContent).not.toContain('missing');
            });
            await waitFor(() => {
                const docsShaLabel = screen.getByText('Docs RAG SHA');
                expect(docsShaLabel.nextElementSibling?.textContent).toContain('abc123');
            });
            await fireEvent.click(copyButton);

            expect(writeText).toHaveBeenCalledTimes(1);
            const copiedText = writeText.mock.calls[0][0];
            expect(copiedText).toContain('Prompt version: v3:');
            expect(copiedText).toContain('App build SHA:');
            expect(copiedText).toContain('App build SHA source:');
            expect(copiedText).toContain('Docs RAG SHA: abc123');
            expect(copiedText).toContain('Docs pack env: staging');
            expect(copiedText).toContain('Docs env derived: n/a');
            expect(copiedText).toContain(`Docs host: ${window.location.host}`);
            expect(copiedText).toContain('Docs RAG generatedAt: just-now');
            expect(copiedText).toContain('Docs pack sourceRef: refs/heads/main');
            expect(copiedText).toContain('Docs RAG comparison: ✅ in sync');
            expect(copiedText).not.toContain('missing');
        } finally {
            if (originalClipboardDescriptor) {
                Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                delete (navigator as any).clipboard;
            }
        }
    });

    it('shows PlayerState summary details when state is present', async () => {
        mockLoadGameState.mockReturnValue({
            settings: {
                showChatDebugPayload: true,
            },
            quests: {
                tutorial: { finished: true },
                fuel: { finished: false },
            },
            inventory: {
                fuel: 3,
                scrap: 0,
                metal: 12,
            },
            processes: {},
            versionNumberString: '3',
        });

        render(OpenAIChat);

        const includedLabel = await screen.findByText('PlayerState included');
        await waitFor(() => {
            expect(includedLabel.nextElementSibling?.textContent).toContain('yes');
        });

        const finishedLabel = await screen.findByText('PlayerState questsFinished');
        await waitFor(() => {
            expect(finishedLabel.nextElementSibling?.textContent).toContain('1');
        });

        const inventoryIncludedLabel = await screen.findByText('PlayerState inventory entries');
        await waitFor(() => {
            expect(inventoryIncludedLabel.nextElementSibling?.textContent).toContain('2');
        });

        const inventoryTotalLabel = await screen.findByText('PlayerState inventory total');
        await waitFor(() => {
            expect(inventoryTotalLabel.nextElementSibling?.textContent).toContain('2');
        });
    });
});
