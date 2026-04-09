import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Processes from '../Processes.svelte';

const { customListMock } = vi.hoisted(() => ({
    customListMock: vi.fn(),
}));

vi.mock('../../../generated/processes.json', () => ({
    default: [
        {
            id: 'built-in-1',
            title: 'Built In Process',
            duration: '10m',
            requireItems: [{ id: 'a', count: 1 }],
            consumeItems: [{ id: 'b', count: 2 }],
            createItems: [{ id: 'c', count: 3 }],
        },
    ],
}));

vi.mock('../../../utils/customcontent.js', () => ({
    db: {
        list: customListMock,
    },
    ENTITY_TYPES: {
        PROCESS: 'process',
    },
}));

describe('Processes list route contract', () => {
    beforeEach(() => {
        customListMock.mockReset();
    });

    it('renders built-in summary rows immediately and keeps navigation controls', () => {
        customListMock.mockResolvedValue([]);
        render(Processes);

        expect(screen.getByText('Built In Process')).toBeTruthy();
        expect(screen.queryByText('Loading processes...')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Buy required items' })).toBeNull();

        expect(screen.getByRole('link', { name: 'Create a new process' }).getAttribute('href')).toBe(
            '/processes/create'
        );
        expect(screen.getByRole('link', { name: 'Manage processes' }).getAttribute('href')).toBe(
            '/processes/manage'
        );
        expect(screen.getByRole('link', { name: 'View details' }).getAttribute('href')).toBe(
            '/processes/built-in-1'
        );
    });

    it('merges custom processes asynchronously after mount', async () => {
        customListMock.mockResolvedValue([
            {
                id: 'custom-1',
                title: 'Custom Process',
                duration: '20m',
                custom: true,
                requireItems: [],
                consumeItems: [],
                createItems: [],
            },
        ]);

        render(Processes);

        expect(await screen.findByText('Custom Process')).toBeTruthy();
        expect(screen.getByText('Custom')).toBeTruthy();

        const detailLinks = screen.getAllByRole('link', { name: 'View details' });
        expect(detailLinks.length).toBe(2);
        expect(detailLinks[1].getAttribute('href')).toBe('/processes/custom-1');
    });
});
