/**
 * @jest-environment jsdom
 */
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent, waitFor, act } from '@testing-library/svelte';
import { jest } from 'vitest';

import QuestForm from '../src/components/svelte/QuestForm.svelte';
import { DEFAULT_DIALOGUE_NODE_ID } from '../src/utils/questDefaults.js';

const questsAddMock = jest.fn();
const listMock = jest.fn();

jest.mock('../src/utils/customcontent.js', () => ({
    db: {
        quests: {
            add: questsAddMock,
            update: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
        },
        list: listMock,
    },
    ENTITY_TYPES: { QUEST: 'quest', ITEM: 'item' },
}));

jest.mock('../src/utils/customQuestValidation.js', () => ({
    validateQuestData: () => ({ valid: true, errors: [] }),
    validateQuestDependencies: () => true,
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

describe('QuestForm simulation tests', () => {
    let container;

    beforeEach(() => {
        container = setupDom();
        questsAddMock.mockReset();
        questsAddMock.mockResolvedValue('quest-123');
        listMock.mockReset();
        listMock.mockResolvedValue([]);
        global.__SSR__ = false;
        global.__BROWSER__ = true;
    });

    afterEach(() => {
        container.innerHTML = '';
    });

    it('blocks submission when simulation tests fail', async () => {
        const { getByLabelText, getAllByLabelText, getByTestId, findByText, getByRole } = render(
            QuestForm,
            {
                target: container,
                props: { existingQuests: [] },
            }
        );

        await waitFor(() => expect(listMock).toHaveBeenCalled());

        await act(async () => {
            fireEvent.input(getByLabelText(/title\*/i), {
                target: { value: 'Looping Quest' },
            });
            fireEvent.input(getByLabelText(/description\*/i), {
                target: { value: 'A quest that never finishes due to loop.' },
            });
        });

        await act(async () => {
            fireEvent.change(getAllByLabelText('Type')[0], {
                target: { value: 'goto' },
            });
            fireEvent.input(getByLabelText('Target node'), {
                target: { value: DEFAULT_DIALOGUE_NODE_ID },
            });
        });

        await waitFor(() =>
            expect(getByTestId('simulation-status')).toHaveAttribute('data-state', 'fail')
        );
        await findByText('No finish option is reachable from the start node.');

        const submitButton = getByRole('button', { name: /create quest/i });
        await act(async () => {
            fireEvent.click(submitButton);
        });

        await waitFor(() => expect(questsAddMock).not.toHaveBeenCalled());
    });
});
