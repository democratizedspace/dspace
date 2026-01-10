/**
 * @jest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, render, waitFor, within } from '@testing-library/svelte';
import { jest } from 'vitest';

import QuestForm from '../src/components/svelte/QuestForm.svelte';

const listMock = jest.fn();

jest.mock('../src/utils/customcontent.js', () => ({
    db: {
        quests: {
            add: jest.fn(),
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

describe('QuestForm dialogue editing', () => {
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

    it('allows adding, editing, and removing dialogue nodes and options', async () => {
        const {
            getByLabelText,
            getByText,
            container: rendered,
        } = render(QuestForm, {
            target: container,
            props: { existingQuests: [] },
        });

        await waitFor(() => expect(listMock).toHaveBeenCalled());

        await fireEvent.input(getByLabelText(/new node id/i), {
            target: { value: 'alpha' },
        });
        await fireEvent.input(getByLabelText(/node text/i), {
            target: { value: 'Hello from alpha.' },
        });
        await fireEvent.click(getByText(/add dialogue node/i));

        await waitFor(() => {
            expect(rendered.querySelectorAll('.dialogue-node')).toHaveLength(2);
        });

        const nodeSections = Array.from(rendered.querySelectorAll('.dialogue-node'));
        const targetNode = nodeSections.find(
            (section) => section.querySelector('h3')?.textContent === 'alpha'
        );
        expect(targetNode).toBeTruthy();

        const nodeScope = within(targetNode);
        await fireEvent.input(nodeScope.getByLabelText(/dialogue text/i), {
            target: { value: 'Updated alpha dialogue.' },
        });

        await fireEvent.input(nodeScope.getByLabelText(/new option text/i), {
            target: { value: 'Finish up.' },
        });
        await fireEvent.change(nodeScope.getByLabelText(/^type$/i), {
            target: { value: 'finish' },
        });
        await fireEvent.click(nodeScope.getByText(/add option/i));

        await waitFor(() => {
            expect(targetNode.querySelectorAll('.option-row')).toHaveLength(1);
        });

        await fireEvent.click(nodeScope.getByRole('button', { name: /remove option/i }));

        await waitFor(() => {
            expect(targetNode.querySelectorAll('.option-row')).toHaveLength(0);
        });

        await fireEvent.click(nodeScope.getByRole('button', { name: /remove node/i }));

        await waitFor(() => {
            expect(rendered.querySelectorAll('.dialogue-node')).toHaveLength(1);
        });
    });
});
