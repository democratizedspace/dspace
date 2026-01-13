/** @jest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';

import ManageProcesses from '../src/pages/processes/svelte/ManageProcesses.svelte';

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

describe('ManageProcesses actions', () => {
    it('shows a create process button', () => {
        const { getByRole } = render(ManageProcesses, { processes: [] });

        const createLink = getByRole('link', { name: 'Create a new process' });
        expect(createLink).toHaveAttribute('href', '/processes/create');
    });
});
