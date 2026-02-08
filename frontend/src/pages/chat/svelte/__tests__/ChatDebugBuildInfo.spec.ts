import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import OpenAIChat from '../OpenAIChat.svelte';

const mockFetch = vi.hoisted(() => vi.fn());
const mockLoadGameState = vi.hoisted(() =>
    vi.fn(() => ({
        settings: {
            showChatDebugPayload: true,
        },
        quests: {},
        inventory: {},
    }))
);
const mockStateSubscribe = vi.hoisted(() => vi.fn());

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
    loadGameState: mockLoadGameState,
    ready: Promise.resolve(),
    state: {
        subscribe: (handler: (state: { settings: { showChatDebugPayload: boolean } }) => void) =>
            mockStateSubscribe(handler),
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
    const setGameState = (state: {
        settings: { showChatDebugPayload: boolean };
        quests?: Record<string, { finished?: boolean }>;
        inventory?: Record<string, number>;
    }) => {
        mockLoadGameState.mockReturnValue(state);
        mockStateSubscribe.mockImplementation((handler) => {
            handler(state);
            return () => {};
        });
    };

    beforeEach(() => {
        setHost('https://localhost:3000/chat');
        setGameState({
            settings: {
                showChatDebugPayload: true,
            },
            quests: {},
            inventory: {},
        });
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
            new Response(JSON.stringify({ error: 'missing' }), { status: 404 })
        );
        vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
        cleanup();
        delete process.env.VITE_GIT_SHA;
        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
        });
        vi.clearAllMocks();
        vi.unstubAllGlobals();
        mockGetDocsRagMeta.mockReset();
        mockGetDocsRagComparison.mockReset();
        mockGetDocsRagMismatchWarning.mockReset();
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

        const promptVersion = await screen.findByText(/Prompt version: v3:/);
        expect(promptVersion).toBeInTheDocument();

        const docsDerivedEnvLabel = await screen.findByText('Docs env derived');
        expect(docsDerivedEnvLabel.nextElementSibling?.textContent).toContain('dev');
    });

    it('uses app build metadata on a staging host', async () => {
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
            status: 'unverified',
            message: `⚠️ cannot verify app/docs sync (app SHA ${appSha})`,
        }));

        render(OpenAIChat);

        await waitFor(() => {
            expect(mockGetDocsRagComparison).toHaveBeenCalledWith(
                expect.not.stringContaining('missing'),
                'docs-only'
            );
        });
    });

    it('uses runtime build metadata on a staging host', async () => {
        setHost('https://staging.democratized.space/chat');
        delete process.env.VITE_GIT_SHA;
        mockFetch.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    gitSha: 'runtime123456',
                    generatedAt: 'just-now',
                    source: 'ci',
                }),
                { status: 200 }
            )
        );

        render(OpenAIChat);

        const appBuildLabel = await screen.findByText('App build SHA');
        await waitFor(() => {
            expect(appBuildLabel.nextElementSibling?.textContent).toContain('runtime123456');
        });

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        await waitFor(() => {
            expect(appBuildSourceLabel.nextElementSibling?.textContent).toContain('ci');
        });

        await waitFor(() => {
            expect(mockGetDocsRagComparison).toHaveBeenCalledWith('runtime123456', 'abc123');
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

    it('shows PlayerState summary counts from game state', async () => {
        setGameState({
            settings: {
                showChatDebugPayload: true,
            },
            quests: {
                first: { finished: true },
                second: { finished: false },
            },
            inventory: {
                oxygen: 3,
                water: 0,
                fuel: 2,
            },
        });

        render(OpenAIChat);

        const playerStateIncluded = await screen.findByText('PlayerState included');
        expect(playerStateIncluded.nextElementSibling?.textContent).toContain('yes');

        const questsFinishedLabel = await screen.findByText('PlayerState questsFinished');
        expect(questsFinishedLabel.nextElementSibling?.textContent).toContain('1');

        const inventoryEntriesLabel = await screen.findByText('PlayerState inventory entries');
        expect(inventoryEntriesLabel.nextElementSibling?.textContent).toContain('2');

        const inventoryTotalLabel = await screen.findByText('PlayerState inventory total');
        expect(inventoryTotalLabel.nextElementSibling?.textContent).toContain('2');
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
            await fireEvent.click(copyButton);

            expect(writeText).toHaveBeenCalledTimes(1);
            const copiedText = writeText.mock.calls[0][0];
            expect(copiedText).toContain('Prompt version: v3:abc123d');
            expect(copiedText).toContain('App build SHA: abc123def456');
            expect(copiedText).toContain('App build SHA source: vite');
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
});
