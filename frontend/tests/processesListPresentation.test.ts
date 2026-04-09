import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Processes from '../src/pages/processes/Processes.svelte';

const { mockList } = vi.hoisted(() => ({ mockList: vi.fn() }));

vi.mock('../src/generated/processes.json', () => ({
    default: [
        {
            id: 'test-process',
            title: 'Test Process',
            duration: '1h',
            requireItems: [{ id: 'r1', count: 1 }],
            consumeItems: [],
            createItems: [{ id: 'c1', count: 1 }],
        },
    ],
}));

vi.mock('../src/utils/customcontent.js', () => ({
    db: {
        list: mockList,
    },
    ENTITY_TYPES: {
        PROCESS: 'process',
    },
}));

describe('/processes list presentation contract', () => {
    beforeEach(() => {
        mockList.mockReset();
        mockList.mockResolvedValue([]);
    });

    it('renders built-in summary rows immediately with navigation controls', async () => {
        render(Processes);

        expect(screen.getByText('Test Process')).toBeTruthy();
        expect(screen.queryByText('Loading processes...')).toBeNull();
        expect(screen.queryByText('Buy required items')).toBeNull();

        expect(
            screen.getByRole('link', { name: 'Create a new process' }).getAttribute('href')
        ).toBe('/processes/create');
        expect(screen.getByRole('link', { name: 'Manage processes' }).getAttribute('href')).toBe(
            '/processes/manage'
        );
        expect(screen.getByRole('link', { name: 'View details' }).getAttribute('href')).toBe(
            '/processes/test-process'
        );

        expect(await screen.findByText('Test Process')).toBeTruthy();
    });

    it('merges custom processes asynchronously after first paint', async () => {
        mockList.mockResolvedValueOnce([
            {
                id: 'custom-process',
                title: 'Custom Process',
                duration: '2h',
                requireItems: [],
                consumeItems: [],
                createItems: [],
                custom: true,
            },
        ]);

        render(Processes);

        expect(screen.getByText('Test Process')).toBeTruthy();
        expect(await screen.findByText('Custom Process')).toBeTruthy();
        expect(await screen.findByText('Custom')).toBeTruthy();
    });
});
