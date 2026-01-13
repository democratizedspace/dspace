/** @jest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ManageItems from '../src/pages/inventory/svelte/ManageItems.svelte';
import ManageQuests from '../src/pages/quests/svelte/ManageQuests.svelte';
import ManageProcesses from '../src/pages/processes/svelte/ManageProcesses.svelte';
import Processes from '../src/pages/processes/Processes.svelte';

vi.mock('../src/utils/customcontent.js', () => ({
    db: {
        list: vi.fn().mockResolvedValue([]),
        items: { delete: vi.fn() },
        quests: { delete: vi.fn() },
        processes: { delete: vi.fn() },
    },
    ENTITY_TYPES: {
        ITEM: 'item',
        PROCESS: 'process',
    },
    listCustomQuests: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/utils/gameState.js', () => ({
    questFinished: vi.fn(() => false),
}));

vi.mock('../src/utils/gameState/common.js', () => ({
    ready: Promise.resolve(),
    state: {
        subscribe: (callback) => {
            callback({});
            return () => {};
        },
    },
}));

describe('Manage pages action buttons', () => {
    it('shows the create item button on manage items', async () => {
        render(ManageItems, { props: { items: [] } });
        const createButton = await screen.findByRole('link', { name: 'Create a new item' });
        expect(createButton).toHaveAttribute('href', '/inventory/create');
    });

    it('shows the create quest button on manage quests', async () => {
        render(ManageQuests, { props: { quests: [] } });
        const createButton = await screen.findByRole('link', { name: 'Create a new quest' });
        expect(createButton).toHaveAttribute('href', '/quests/create');
    });

    it('shows the create process button on manage processes', async () => {
        render(ManageProcesses, { props: { processes: [] } });
        const createButton = await screen.findByRole('link', { name: 'Create a new process' });
        expect(createButton).toHaveAttribute('href', '/processes/create');
    });

    it('shows create and manage buttons on the processes page', async () => {
        render(Processes);
        const createButton = await screen.findByRole('link', { name: 'Create a new process' });
        const manageButton = await screen.findByRole('link', { name: 'Manage processes' });

        expect(createButton).toHaveAttribute('href', '/processes/create');
        expect(manageButton).toHaveAttribute('href', '/processes/manage');
    });
});
