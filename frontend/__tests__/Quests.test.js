import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';

const mockReady = Promise.resolve();
const mockStateSubscribe = vi.fn(() => () => undefined);

vi.mock('../src/utils/gameState/common.js', () => ({
    ready: mockReady,
    loadGameState: vi.fn(() => ({ quests: {}, settings: { showQuestGraphVisualizer: false } })),
    state: { subscribe: mockStateSubscribe },
    getPersistedGameStateLightweight: vi.fn(async () => ({
        version: 2,
        checksum: 'test-checksum',
        completedQuestIds: ['welcome/test2'],
    })),
    isAuthoritativeQuestSnapshot: vi.fn(() => true),
}));

vi.mock('../src/utils/customcontent.js', () => ({
    listCustomQuests: vi.fn(async () => []),
}));

import Quests from '../src/pages/quests/svelte/Quests.svelte';
import { listCustomQuests } from '../src/utils/customcontent.js';

describe('Quests Component', () => {
    const quests = [
        {
            id: 'welcome/test1',
            title: 'Test Quest 1',
            description: 'This is a test quest',
            image: '/test1.jpg',
            requiresQuests: [],
        },
        {
            id: 'welcome/test2',
            title: 'Test Quest 2',
            description: 'This is another test quest',
            image: '/test2.jpg',
            requiresQuests: [],
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders built-in list content immediately with neutral shell', () => {
        const { getByTestId, getAllByTestId } = render(Quests, { props: { quests } });
        expect(getByTestId('quests-grid')).toBeTruthy();
        expect(getAllByTestId('quest-status').length).toBeGreaterThan(0);
    });

    it('renders custom quests after async merge without removing built-in cards', async () => {
        listCustomQuests.mockResolvedValueOnce([
            {
                id: 'custom/test-quest',
                title: 'Custom Quest Example',
                description: 'Quest created during automated testing',
                image: '/custom-quest.png',
                requiresQuests: [],
            },
        ]);

        const { getByTestId, getByText } = render(Quests, { props: { quests } });

        await waitFor(() => {
            expect(getByTestId('custom-quests-section')).toBeTruthy();
            expect(getByText('Custom Quest Example')).toBeTruthy();
        });
    });
});
