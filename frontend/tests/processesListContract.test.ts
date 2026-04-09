// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/svelte';
import Processes from '../src/pages/processes/Processes.svelte';

const { listMock } = vi.hoisted(() => ({
    listMock: vi.fn(),
}));

vi.mock('../src/utils/customcontent.js', () => ({
    db: {
        list: listMock,
    },
    ENTITY_TYPES: {
        PROCESS: 'process',
    },
}));

describe('Processes list/detail contract', () => {
    beforeEach(() => {
        listMock.mockReset();
    });

    it('does not use ProcessView/detail rendering on the list component path', () => {
        const componentPath = path.join(__dirname, '../src/pages/processes/Processes.svelte');
        const source = readFileSync(componentPath, 'utf8');

        expect(source).not.toContain('ProcessView');
        expect(source).toContain('ProcessListRow');
        expect(source).not.toContain('Loading processes...');
    });

    it('renders custom processes asynchronously without blocking initial render', async () => {
        listMock.mockResolvedValue([
            {
                id: 'custom-oxygen-cycle',
                title: 'Custom oxygen cycle',
                duration: '2m',
                requireItems: [{ id: 'tank', count: 1 }],
                consumeItems: [],
                createItems: [{ id: 'oxygen', count: 1 }],
            },
        ]);

        render(Processes);

        expect(screen.queryByText('Loading processes...')).toBeNull();
        expect(screen.queryByText('Custom oxygen cycle')).toBeNull();

        expect(await screen.findByText('Custom oxygen cycle')).toBeTruthy();
        const detailsLink = await screen.findByRole('link', { name: 'View details' });
        expect(detailsLink.getAttribute('href')).toBe('/processes/custom-oxygen-cycle');
        expect(screen.getByText('Custom')).toBeTruthy();
    });

    it('renders built-in process rows from the route scaffold and keeps action links', () => {
        const indexPath = path.join(__dirname, '../src/pages/processes/index.astro');
        const source = readFileSync(indexPath, 'utf8');

        expect(source).toContain('builtInProcesses.map');
        expect(source).toContain('<ProcessListRow process={process} />');
        expect(source).toContain('data-built-in-count={builtInProcesses.length}');
        expect(source).toContain('Create a new process');
        expect(source).toContain('/processes/create');
        expect(source).toContain('Manage processes');
        expect(source).toContain('/processes/manage');
    });
});
