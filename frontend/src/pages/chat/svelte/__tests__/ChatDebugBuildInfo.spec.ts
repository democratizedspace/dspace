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
const mockFetch = vi.hoisted(() => vi.fn());

const mockGameState = {
    settings: {
        showChatDebugPayload: true,
    },
    versionNumberString: '3',
    quests: {
        'welcome/howtodoquests': { finished: true },
    },
    inventory: {
        'item-alpha': 2,
    },
};

vi.mock('../../../../utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({
        settings: {
            showChatDebugPayload: true,
        },
        versionNumberString: '3',
        quests: {
            'welcome/howtodoquests': { finished: true },
        },
        inventory: {
            'item-alpha': 2,
        },
    })),
    ready: Promise.resolve(),
    state: {
        subscribe: (handler: (state: typeof mockGameState) => void) => {
            handler(mockGameState);
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
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                gitSha: 'runtime123',
                generatedAt: 'now',
                source: 'build-meta',
                resolvedFrom: '/app/build_meta.json',
            }),
        });
        vi.stubGlobal('fetch', mockFetch);
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
        vi.unstubAllGlobals();
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

    it('derives env when docs pack env is unknown', async () => {
        delete process.env.VITE_GIT_SHA;
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({}),
        });
        mockGetDocsRagMeta.mockResolvedValueOnce({
            gitSha: 'docs-only',
            docsGitSha: 'docs-only',
            generatedAt: 'just-now',
            envName: 'unknown',
            sourceRef: 'refs/heads/main',
        });

        render(OpenAIChat);

        const promptVersion = await screen.findByText(/Prompt version:/);
        expect(promptVersion).toBeInTheDocument();

        const appBuildLabel = await screen.findByText('App build SHA');
        expect(appBuildLabel.nextElementSibling?.textContent).not.toContain('missing');

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        expect(appBuildSourceLabel.nextElementSibling?.textContent).not.toContain('missing');

        const docsDerivedEnvLabel = await screen.findByText('Docs env derived');
        expect(docsDerivedEnvLabel.nextElementSibling?.textContent).toContain('dev');
    });

    it('uses runtime build metadata on a staging host', async () => {
        setHost('https://staging.democratized.space/chat');
        delete process.env.VITE_GIT_SHA;
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                gitSha: 'runtime-staging',
                generatedAt: 'now',
                source: 'build-meta',
            }),
        });
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
        expect(appBuildLabel.nextElementSibling?.textContent).not.toContain('missing');

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        expect(appBuildSourceLabel.nextElementSibling?.textContent).not.toContain('missing');

        await waitFor(() => {
            expect(mockGetDocsRagComparison).toHaveBeenCalledWith(
                expect.not.stringContaining('missing'),
                'docs-only'
            );
        });
    });

    it('shows in sync when app SHA matches docs on a prod host', async () => {
        setHost('https://democratized.space/chat');
        process.env.VITE_GIT_SHA = 'abc123def456';
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                gitSha: 'runtime123',
                generatedAt: 'now',
                source: 'build-meta',
            }),
        });
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
            const appBuildSourceLabel = await screen.findByText('App build SHA source');
            await waitFor(() => {
                expect(appBuildSourceLabel.nextElementSibling?.textContent).toContain('vite');
            });
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

    it('summarizes player state in the debug panel', async () => {
        render(OpenAIChat);

        const playerStateIncluded = await screen.findByText('PlayerState included');
        await waitFor(() => {
            expect(playerStateIncluded.nextElementSibling?.textContent).toContain('yes');
        });

        const questsFinished = await screen.findByText('PlayerState questsFinished');
        expect(questsFinished.nextElementSibling?.textContent).toContain('1');

        const inventoryEntries = await screen.findByText('PlayerState inventory entries');
        expect(inventoryEntries.nextElementSibling?.textContent).toContain('1');
    });
});
