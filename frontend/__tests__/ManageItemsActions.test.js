/** @jest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';

import ManageItems from '../src/pages/inventory/svelte/ManageItems.svelte';

vi.mock('../src/utils/customcontent.js', () => {
    return {
        db: {
            list: vi.fn().mockResolvedValue([]),
        },
        ENTITY_TYPES: {
            ITEM: 'item',
        },
    };
});

describe('ManageItems actions', () => {
    it('shows a create item button', () => {
        const { getByRole } = render(ManageItems, { items: [] });

        const createLink = getByRole('link', { name: 'Create a new item' });
        expect(createLink).toHaveAttribute('href', '/inventory/create');
    });
});
