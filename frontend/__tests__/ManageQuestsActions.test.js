/** @jest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import { readable } from 'svelte/store';

import ManageQuests from '../src/pages/quests/svelte/ManageQuests.svelte';

vi.mock('../src/utils/gameState.js', () => {
    return {
        questFinished: vi.fn(() => false),
    };
});

vi.mock('../src/utils/gameState/common.js', () => {
    return {
        state: readable({}),
        ready: Promise.resolve(),
    };
});

vi.mock('../src/utils/customcontent.js', () => {
    return {
        db: {
            quests: {
                delete: vi.fn(),
            },
        },
        listCustomQuests: vi.fn().mockResolvedValue([]),
    };
});

describe('ManageQuests actions', () => {
    it('shows a create quest button', () => {
        const { getByRole } = render(ManageQuests, { quests: [] });

        const createLink = getByRole('link', { name: 'Create a new quest' });
        expect(createLink).toHaveAttribute('href', '/quests/create');
    });
});
