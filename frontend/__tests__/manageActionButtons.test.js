/** @jest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/svelte';
import ManageItems from '../src/pages/inventory/svelte/ManageItems.svelte';
import ManageQuests from '../src/pages/quests/svelte/ManageQuests.svelte';
import ManageProcesses from '../src/pages/processes/svelte/ManageProcesses.svelte';

vi.mock('../src/generated/processes.json', () => ({
    default: [
        {
            id: 'test-process',
            title: 'Test Process',
            duration: '1h',
            requireItems: [],
            consumeItems: [],
            createItems: [],
        },
    ],
}));

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

    it('shows the view item button on manage items', async () => {
        render(ManageItems, { props: { items: [] } });
        const viewButton = await screen.findByRole('link', { name: 'View items' });
        expect(viewButton).toHaveAttribute('href', '/inventory');
    });

    it('shows the create quest button on manage quests', async () => {
        render(ManageQuests, { props: { quests: [] } });
        const createButton = await screen.findByRole('link', { name: 'Create a new quest' });
        expect(createButton).toHaveAttribute('href', '/quests/create');
    });

    it('shows the view quest button on manage quests', async () => {
        render(ManageQuests, { props: { quests: [] } });
        const viewButton = await screen.findByRole('link', { name: 'View quests' });
        expect(viewButton).toHaveAttribute('href', '/quests');
    });

    it('shows the create process button on manage processes', async () => {
        render(ManageProcesses, { props: { processes: [] } });
        const createButton = await screen.findByRole('link', { name: 'Create a new process' });
        expect(createButton).toHaveAttribute('href', '/processes/create');
    });

    it('shows the view process button on manage processes', async () => {
        render(ManageProcesses, { props: { processes: [] } });
        const viewButton = await screen.findByRole('link', { name: 'View processes' });
        expect(viewButton).toHaveAttribute('href', '/processes');
    });

    it('keeps create/manage action buttons on the processes page route scaffold', () => {
        const indexPath = path.join(__dirname, '../src/pages/processes/index.astro');
        const source = readFileSync(indexPath, 'utf8');

        expect(source).toContain('Create a new process');
        expect(source).toContain('/processes/create');
        expect(source).toContain('Manage processes');
        expect(source).toContain('/processes/manage');
    });
});
