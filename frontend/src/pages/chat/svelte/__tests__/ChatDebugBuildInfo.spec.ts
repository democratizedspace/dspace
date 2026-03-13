import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import OpenAIChat from '../OpenAIChat.svelte';
import { loadGameState } from '../../../../utils/gameState/common.js';

vi.mock('../../../../generated/build_meta.json', () => ({
    default: {
        gitSha: 'missing',
        generatedAt: '',
        source: 'static',
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
let gameStateSubscriber: ((state: { settings: { showChatDebugPayload: boolean } }) => void) | null =
    null;

vi.mock('../../../../utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({
        settings: {
            showChatDebugPayload: true,
        },
    })),
    ready: Promise.resolve(),
    state: {
        subscribe: (handler: (state: { settings: { showChatDebugPayload: boolean } }) => void) => {
            gameStateSubscriber = handler;
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
    let fetchMock: ReturnType<typeof vi.fn>;
    const setHost = (url: string) => {
        Object.defineProperty(window, 'location', {
            value: new URL(url),
            writable: true,
        });
    };

    beforeEach(() => {
        setHost('https://localhost:3000/chat');
        fetchMock = vi.fn().mockResolvedValue({ ok: false });
        vi.stubGlobal('fetch', fetchMock);
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
        vi.unstubAllGlobals();
        vi.clearAllMocks();
        mockGetDocsRagMeta.mockReset();
        mockGetDocsRagComparison.mockReset();
        mockGetDocsRagMismatchWarning.mockReset();
        gameStateSubscriber = null;
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

    it('derives env and uses docs pack SHA when app SHA is missing', async () => {
        delete process.env.VITE_GIT_SHA;
        mockGetDocsRagMeta.mockResolvedValueOnce({
            gitSha: 'docs-only',
            docsGitSha: 'docs-only',
            generatedAt: 'just-now',
            envName: 'unknown',
            sourceRef: 'refs/heads/main',
        });

        render(OpenAIChat);

        const promptVersion = await screen.findByText('Prompt version: v3:docs-on');
        expect(promptVersion).toBeInTheDocument();

        const appBuildLabel = await screen.findByText('App build SHA');
        expect(appBuildLabel.nextElementSibling?.textContent).toContain('docs-only');

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        expect(appBuildSourceLabel.nextElementSibling?.textContent).toContain(
            'docs-pack-fallback (dev)'
        );

        const docsDerivedEnvLabel = await screen.findByText('Docs env derived');
        expect(docsDerivedEnvLabel.nextElementSibling?.textContent).toContain('dev');
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
        mockGetDocsRagComparison.mockImplementation(() => ({
            status: 'unverified',
            message: '⚠️ cannot verify app/docs sync (app SHA missing)',
        }));

        render(OpenAIChat);

        const appBuildLabel = await screen.findByText('App build SHA');
        await waitFor(() => {
            expect(appBuildLabel.nextElementSibling?.textContent).toContain('missing');
        });

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        expect(appBuildSourceLabel.nextElementSibling?.textContent).toContain('missing');

        const comparisonLabel = await screen.findByText('Docs RAG comparison');
        const comparisonRow = comparisonLabel.closest('.debug-meta-row');
        expect(comparisonRow?.textContent).toContain(
            '⚠️ cannot verify app/docs sync (app SHA missing)'
        );
        await waitFor(() => {
            expect(mockGetDocsRagComparison).toHaveBeenCalledWith('missing', 'docs-only');
        });
    });

    it('prefers runtime build metadata when available', async () => {
        setHost('https://staging.democratized.space/chat');
        delete process.env.VITE_GIT_SHA;
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                gitSha: 'runtime-sha-123',
                generatedAt: 'just-now',
                source: 'ci',
            }),
        });

        render(OpenAIChat);

        const appBuildLabel = await screen.findByText('App build SHA');
        await waitFor(() => {
            expect(appBuildLabel.nextElementSibling?.textContent).toContain('runtime-sha-123');
        });

        const appBuildSourceLabel = await screen.findByText('App build SHA source');
        await waitFor(() => {
            expect(appBuildSourceLabel.nextElementSibling?.textContent).toContain('ci');
            expect(appBuildSourceLabel.nextElementSibling?.textContent).toContain('runtime');
        });

        await waitFor(() => {
            expect(mockGetDocsRagComparison).toHaveBeenCalledWith('runtime-sha-123', 'abc123');
        });
    });

    it('shows PlayerState summary from the current game state', async () => {
        vi.mocked(loadGameState).mockReturnValueOnce({
            openAI: {},
            versionNumberString: '3',
            quests: {
                'welcome/howtodoquests': { finished: true },
            },
            inventory: {
                'item-alpha': 2,
            },
            settings: {
                showChatDebugPayload: true,
            },
        });

        render(OpenAIChat);
        await waitFor(async () => {
            const includedLabel = await screen.findByText('PlayerState included');
            expect(includedLabel.nextElementSibling).toHaveTextContent('yes');
        });

        const questsLabel = await screen.findByText('PlayerState questsFinished');
        expect(questsLabel.nextElementSibling).toHaveTextContent('1');

        const completedLabel = await screen.findByText('PlayerState completed official quests');
        expect(completedLabel.nextElementSibling).toHaveTextContent('1');

        const totalLabel = await screen.findByText('PlayerState total official quests');
        expect(Number(totalLabel.nextElementSibling?.textContent || '0')).toBeGreaterThan(0);

        const remainingLabel = await screen.findByText('PlayerState remaining official quests');
        expect(
            Number(remainingLabel.nextElementSibling?.textContent || '0')
        ).toBeGreaterThanOrEqual(0);

        const inventoryIncludedLabel = await screen.findByText('PlayerState inventory entries');
        expect(inventoryIncludedLabel.nextElementSibling).toHaveTextContent('1');
    });

    it('updates PlayerState summary when the game state store changes', async () => {
        render(OpenAIChat);

        await waitFor(async () => {
            const includedLabel = await screen.findByText('PlayerState included');
            expect(includedLabel.nextElementSibling).toHaveTextContent('no');
        });

        gameStateSubscriber?.({
            settings: {
                showChatDebugPayload: true,
            },
            openAI: {},
            versionNumberString: '3',
            quests: {
                'welcome/howtodoquests': { finished: true },
            },
            inventory: {
                'item-alpha': 2,
                'item-beta': 1,
            },
        });

        await waitFor(async () => {
            const includedLabel = await screen.findByText('PlayerState included');
            expect(includedLabel.nextElementSibling).toHaveTextContent('yes');
        });

        const questsLabel = await screen.findByText('PlayerState questsFinished');
        expect(questsLabel.nextElementSibling).toHaveTextContent('1');

        const completedLabel = await screen.findByText('PlayerState completed official quests');
        expect(completedLabel.nextElementSibling).toHaveTextContent('1');

        const totalLabel = await screen.findByText('PlayerState total official quests');
        expect(Number(totalLabel.nextElementSibling?.textContent || '0')).toBeGreaterThan(0);

        const remainingLabel = await screen.findByText('PlayerState remaining official quests');
        expect(
            Number(remainingLabel.nextElementSibling?.textContent || '0')
        ).toBeGreaterThanOrEqual(0);

        const inventoryIncludedLabel = await screen.findByText('PlayerState inventory entries');
        expect(inventoryIncludedLabel.nextElementSibling).toHaveTextContent('2');
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

            await screen.findByText('Prompt version: v3:abc123d');

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
