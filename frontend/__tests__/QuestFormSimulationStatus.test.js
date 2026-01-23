/**
 * @jest-environment jsdom
 */
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { jest } from 'vitest';

import QuestForm from '../src/components/svelte/QuestForm.svelte';

const listMock = jest.fn();

jest.mock('../src/utils/customcontent.js', () => ({
    db: {
        list: listMock,
        quests: {
            add: jest.fn(),
            update: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
        },
    },
    ENTITY_TYPES: { QUEST: 'quest', ITEM: 'item' },
}));

jest.mock('../src/utils/questHelpers.js', () => ({
    isQuestTitleUnique: () => true,
}));

function setupDom() {
    document.body.innerHTML = `
        <div id="app">
            <div id="quest-form-container"></div>
        </div>
    `;
    return document.getElementById('quest-form-container');
}

describe('QuestForm simulation status', () => {
    let container;

    beforeEach(() => {
        container = setupDom();
        listMock.mockReset();
        listMock.mockResolvedValue([]);
        global.__SSR__ = false;
        global.__BROWSER__ = true;
    });

    afterEach(() => {
        container.innerHTML = '';
    });

    it('surfaces missing finish path issues in the simulation panel', async () => {
        const { getByLabelText, getByRole, getAllByRole, getByTestId, getByText } = render(
            QuestForm,
            {
                target: container,
                props: { existingQuests: [] },
            }
        );

        await waitFor(() => expect(listMock).toHaveBeenCalled());

        fireEvent.input(getByLabelText(/title\*/i), {
            target: { value: 'Looping Quest' },
        });
        fireEvent.input(getByLabelText(/description\*/i), {
            target: { value: 'This quest loops without an exit.' },
        });

        const removeButtons = getAllByRole('button', { name: /remove option/i });
        fireEvent.click(removeButtons[0]);

        fireEvent.input(getByLabelText(/new option text/i), {
            target: { value: 'Loop back' },
        });
        fireEvent.input(getByLabelText(/target node/i), {
            target: { value: 'start' },
        });
        fireEvent.click(getByRole('button', { name: /add option/i }));

        await waitFor(() =>
            expect(getByTestId('quest-simulation-outcome')).toHaveTextContent(
                /needs attention/i
            )
        );

        expect(getByText(/no finish option is reachable from the start node/i)).toBeInTheDocument();
    });
});
