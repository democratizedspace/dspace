import { render, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Quests from '../Quests.svelte';

const flushPromises = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

const hoisted = vi.hoisted(() => {
    let value = { quests: {}, settings: { showQuestGraphVisualizer: false } };
    const subscribers = new Set<(state: typeof value) => void>();
    let readyResolver: (() => void) | null = null;

    const ready = new Promise<void>((resolve) => {
        readyResolver = resolve;
    });

    return {
        ready,
        resolveReady: () => readyResolver?.(),
        store: {
            subscribe(run: (state: typeof value) => void) {
                run(value);
                subscribers.add(run);
                return () => subscribers.delete(run);
            },
            set(next: typeof value) {
                value = next;
                subscribers.forEach((run) => run(value));
            },
        },
        getPersistedQuestListSnapshotMock: vi.fn(async () => ({
            authoritative: false,
            completedQuestIds: [],
        })),
        listCustomQuestSummariesMock: vi.fn(async () => []),
    };
});

vi.mock('../../../../utils/gameState/common.js', () => ({
    state: hoisted.store,
    ready: hoisted.ready,
    loadGameState: vi.fn(() => ({ quests: {}, settings: { showQuestGraphVisualizer: false } })),
    getPersistedQuestListSnapshot: (...args: unknown[]) =>
        hoisted.getPersistedQuestListSnapshotMock(...args),
}));

vi.mock('../../../../utils/customcontent.js', () => ({
    listCustomQuestSummaries: (...args: unknown[]) => hoisted.listCustomQuestSummariesMock(...args),
}));

describe('Quests list fast path', () => {
    beforeEach(() => {
        hoisted.getPersistedQuestListSnapshotMock.mockResolvedValue({
            authoritative: false,
            completedQuestIds: [],
        });
        hoisted.listCustomQuestSummariesMock.mockResolvedValue([]);
    });

    it('renders built-in quest titles before full state readiness and keeps neutral status', async () => {
        const quests = [
            {
                id: 'welcome/howtodoquests',
                title: 'How to do quests',
                description: 'Start here.',
                image: '/assets/quests/howtodoquests.jpg',
                route: '/quests/welcome/howtodoquests',
                requiresQuests: [],
            },
        ];

        const { getByText, container } = render(Quests, { props: { quests } });

        await waitFor(() => {
            expect(getByText('How to do quests')).toBeTruthy();
        });

        expect(container.querySelector('[data-status="unknown"]')).not.toBeNull();
        expect(container.textContent).toContain('Status syncing');

        hoisted.resolveReady();
        await flushPromises();
    });

    it('merges custom quests after initial built-in render', async () => {
        const quests = [
            {
                id: 'welcome/howtodoquests',
                title: 'How to do quests',
                description: 'Start here.',
                image: '/assets/quests/howtodoquests.jpg',
                route: '/quests/welcome/howtodoquests',
                requiresQuests: [],
            },
        ];

        hoisted.listCustomQuestSummariesMock.mockResolvedValue([
            {
                id: 'custom/quest-a',
                title: 'Custom Quest A',
                description: 'Custom description',
                image: '/assets/quests/howtodoquests.jpg',
                route: '/quests/custom/quest-a',
                requiresQuests: [],
                custom: true,
            },
        ]);

        const { getByText, findByText } = render(Quests, { props: { quests } });
        await waitFor(() => {
            expect(getByText('How to do quests')).toBeTruthy();
        });

        hoisted.resolveReady();
        await flushPromises();
        expect(await findByText('Custom Quest A')).toBeTruthy();
    });
});
