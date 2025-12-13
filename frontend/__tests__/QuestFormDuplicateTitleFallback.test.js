/**
 * @jest-environment jsdom
 */
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent, waitFor, act } from '@testing-library/svelte';

import QuestForm from '../src/components/svelte/QuestForm.svelte';

const questsAddMock = vi.fn();
const listMock = vi.fn();

vi.mock('../src/utils/customcontent.js', () => ({
    db: {
        quests: {
            add: questsAddMock,
            update: vi.fn(),
            get: vi.fn(),
            delete: vi.fn(),
        },
        list: listMock,
    },
    ENTITY_TYPES: { QUEST: 'quest', ITEM: 'item' },
}));

vi.mock('../src/utils/customQuestValidation.js', () => ({
    validateQuestData: () => ({ valid: true, errors: [] }),
    validateQuestDependencies: () => true,
}));

vi.mock('../src/utils/questHelpers.js', async () => {
    const actual = await vi.importActual('../src/utils/questHelpers.js');
    return actual;
});

function setupDom() {
    document.body.innerHTML = `
        <div id="app">
            <div id="quest-form-container"></div>
        </div>
    `;
    return document.getElementById('quest-form-container');
}

describe('QuestForm duplicate title validation', () => {
    let container;

    beforeEach(() => {
        container = setupDom();
        questsAddMock.mockReset();
        listMock.mockReset();
        listMock.mockResolvedValue([]);
        global.__SSR__ = false;
        global.__BROWSER__ = true;
    });

    afterEach(() => {
        container.innerHTML = '';
    });

    it('flags duplicate titles using provided existing quests before IndexedDB sync completes', async () => {
        const existingQuests = [
            { id: 'astronomy/constellations', title: 'Map the Constellations' },
        ];

        const { getByLabelText, findByTestId } = render(QuestForm, {
            target: container,
            props: { existingQuests },
        });

        await waitFor(() => expect(listMock).toHaveBeenCalled());

        const titleInput = getByLabelText(/title\*/i);

        await act(async () => {
            fireEvent.input(titleInput, {
                target: { value: 'Map the Constellations' },
            });
        });

        await act(async () => {
            fireEvent.blur(titleInput);
        });

        const error = await findByTestId('quest-title-error');
        expect(error).toHaveTextContent('Title must be unique');
    });
});
