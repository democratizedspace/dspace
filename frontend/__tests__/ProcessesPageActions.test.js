/** @jest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';

import Processes from '../src/pages/processes/svelte/Processes.svelte';

vi.mock('../src/utils/customcontent.js', () => {
    return {
        db: {
            list: vi.fn().mockResolvedValue([]),
        },
        ENTITY_TYPES: {
            PROCESS: 'process',
        },
    };
});

describe('Processes page actions', () => {
    it('shows create and manage process buttons', () => {
        const { getByRole } = render(Processes, { processes: [] });

        const createLink = getByRole('link', { name: 'Create a new process' });
        expect(createLink).toHaveAttribute('href', '/processes/create');

        const manageLink = getByRole('link', { name: 'Manage processes' });
        expect(manageLink).toHaveAttribute('href', '/processes/manage');
    });
});
