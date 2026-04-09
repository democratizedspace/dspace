import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Processes from '../src/pages/processes/Processes.svelte';
import { db } from '../src/utils/customcontent.js';

vi.mock('../src/generated/processes.json', () => ({
    default: [
        {
            id: 'built-in-process',
            title: 'Built In Process',
            duration: '15m',
            requireItems: [{ id: 'item-1', count: 1 }],
            consumeItems: [{ id: 'item-2', count: 2 }],
            createItems: [{ id: 'item-3', count: 3 }],
        },
    ],
}));

vi.mock('../src/utils/customcontent.js', () => ({
    db: {
        list: vi.fn().mockResolvedValue([]),
    },
    ENTITY_TYPES: {
        PROCESS: 'process',
    },
}));

describe('Processes list presentation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders built-in summary rows immediately without a loading gate', () => {
        render(Processes);

        expect(screen.getByText('Built In Process')).not.toBeNull();
        expect(screen.getByText('Duration: 15m')).not.toBeNull();
        expect(screen.queryByText('Loading processes...')).toBeNull();
    });

    it('does not render ProcessView in list rows', () => {
        render(Processes);

        expect(screen.getByRole('link', { name: 'View details' }).getAttribute('href')).toBe(
            '/processes/built-in-process'
        );
        expect(screen.queryByRole('button', { name: 'Buy required items' })).toBeNull();
    });

    it('merges custom processes asynchronously after mount', async () => {
        vi.mocked(db.list).mockResolvedValueOnce([
            {
                id: 'custom-process',
                title: 'Custom Process',
                duration: '1h',
                requireItems: [],
                consumeItems: [],
                createItems: [],
                custom: true,
            },
        ]);

        render(Processes);

        expect(await screen.findByText('Custom Process')).not.toBeNull();
        expect(screen.getByText('Custom')).not.toBeNull();
        const detailLinks = screen.getAllByRole('link', { name: 'View details' });
        const hrefs = detailLinks.map((link) => link.getAttribute('href'));
        expect(hrefs).toContain('/processes/built-in-process');
        expect(hrefs).toContain('/processes/custom-process');
    });
});
