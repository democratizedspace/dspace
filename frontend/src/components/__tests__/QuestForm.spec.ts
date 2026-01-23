import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import QuestForm from '../svelte/QuestForm.svelte';
import { db } from '../../utils/customcontent.js';
import { syncExistingQuestsToIndexedDB } from '../../utils/questPersistence.js';

vi.mock('../../utils/imageDownsample.js', () => ({
    downsampleAndCompressToJpeg: vi.fn().mockResolvedValue({
        dataUrl: 'data:image/jpeg;base64,COMPRESSED',
        bytes: 12345,
        width: 512,
        height: 512,
        qualityUsed: 0.8,
    }),
}));

vi.mock('../../utils/questPersistence.js', async () => {
    const actual = await vi.importActual('../../utils/questPersistence.js');
    return {
        ...actual,
        syncExistingQuestsToIndexedDB: vi.fn(),
    };
});

test('allows adding dialogue nodes and options', async () => {
    const { getByLabelText, getByText, getAllByLabelText, getAllByText } = render(QuestForm);

    await fireEvent.input(getByLabelText(/New node ID/i), { target: { value: 'start' } });
    await fireEvent.input(getByLabelText(/Node text/i), { target: { value: 'Welcome, pilot!' } });
    await fireEvent.click(getByText('Add Dialogue Node'));

    await fireEvent.input(getByLabelText(/New node ID/i), { target: { value: 'end' } });
    await fireEvent.input(getByLabelText(/Node text/i), {
        target: { value: 'Quest complete.' },
    });
    await fireEvent.click(getByText('Add Dialogue Node'));

    const optionDrafts = getAllByLabelText(/New option text/i);
    await fireEvent.input(optionDrafts[0], { target: { value: 'Proceed to end' } });

    const targetInputs = getAllByLabelText(/Target node/i);
    await fireEvent.input(targetInputs[0], { target: { value: 'end' } });

    await fireEvent.click(getAllByText('Add Option')[0]);

    const optionTextInputs = getAllByLabelText(/^Text$/i);
    const latestOptionInput = optionTextInputs[optionTextInputs.length - 1] as HTMLInputElement;
    expect(latestOptionInput.value).toBe('Proceed to end');
});

test('shows image preview after upload', async () => {
    const { getByLabelText, getByAltText } = render(QuestForm);
    const fileInput = getByLabelText(/Upload an Image/i);
    const file = new File(['d'], 'test.png', { type: 'image/png' });

    await fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
        expect(getByAltText('Quest preview')).toBeTruthy();
    });
});

test('rejects title with forbidden characters', async () => {
    const { getByLabelText, findByText } = render(QuestForm);
    const titleInput = getByLabelText(/Title/i);
    await fireEvent.input(titleInput, { target: { value: '<b>' } });
    const form = document.querySelector('form');
    expect(form).toBeTruthy();
    await fireEvent.submit(form as HTMLFormElement);
    await findByText('Invalid characters');
});

test('replaces the default finish option when adding a custom finish option', async () => {
    const { getAllByLabelText, getByLabelText, getByText, queryByDisplayValue } = render(QuestForm);

    const existingOptionInputs = getAllByLabelText(/^Text$/i);
    expect(existingOptionInputs).toHaveLength(1);
    expect((existingOptionInputs[0] as HTMLInputElement).value).toBe('Finish quest');

    await fireEvent.input(getByLabelText(/New option text/i), {
        target: { value: 'Complete mission' },
    });

    const typeSelects = getAllByLabelText(/^Type$/i);
    const draftTypeSelect = typeSelects[typeSelects.length - 1];
    await fireEvent.change(draftTypeSelect, { target: { value: 'finish' } });

    await fireEvent.click(getByText('Add Option'));

    const optionInputsAfter = getAllByLabelText(/^Text$/i);
    expect(optionInputsAfter).toHaveLength(1);
    expect((optionInputsAfter[0] as HTMLInputElement).value).toBe('Complete mission');
});

test('excludes the current quest from requirements while editing', async () => {
    const existingQuests = [
        { id: 'quest-1', title: 'Quest One' },
        { id: 'quest-2', title: 'Quest Two' },
    ];
    vi.mocked(syncExistingQuestsToIndexedDB).mockResolvedValueOnce(existingQuests);

    const { getByLabelText } = render(QuestForm, {
        props: {
            existingQuests,
            isEdit: true,
            questId: 'quest-1',
        },
    });

    const requirementsSelect = getByLabelText(/Quest Requirements/i) as HTMLSelectElement;

    await waitFor(() => {
        const optionValues = Array.from(requirementsSelect.options).map((option) => option.value);
        expect(optionValues).toEqual(['quest-2']);
    });
});

test('filters self dependencies during edit mode validation', async () => {
    const questId = 'quest-self';
    const questData = {
        id: questId,
        title: 'Self Quest',
        description: 'A description long enough.',
        npc: 'npc',
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'Start',
                options: [{ type: 'finish', text: 'Finish quest' }],
            },
        ],
        requiresQuests: [questId, 'quest-other'],
    };
    await db.quests.add(questData);

    const existingQuests = [
        { id: questId, title: 'Self Quest' },
        { id: 'quest-other', title: 'Other Quest' },
    ];
    vi.mocked(syncExistingQuestsToIndexedDB).mockResolvedValueOnce(existingQuests);

    const { getByLabelText, queryByText } = render(QuestForm, {
        props: {
            existingQuests,
            isEdit: true,
            questId,
        },
    });

    const requirementsSelect = getByLabelText(/Quest Requirements/i) as HTMLSelectElement;

    await waitFor(() => {
        const optionValues = Array.from(requirementsSelect.options).map((option) => option.value);
        expect(optionValues).toEqual(['quest-other']);
        expect(queryByText('Unknown quest dependency')).toBeNull();
    });
});

test('shows an error for unknown quest dependencies', async () => {
    const questId = 'quest-invalid';
    await db.quests.add({
        id: questId,
        title: 'Invalid Quest',
        description: 'A description long enough.',
        npc: 'npc',
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'Start',
                options: [{ type: 'finish', text: 'Finish quest' }],
            },
        ],
        requiresQuests: ['missing-quest'],
    });

    const existingQuests = [{ id: 'quest-valid', title: 'Valid Quest' }];
    vi.mocked(syncExistingQuestsToIndexedDB).mockResolvedValueOnce(existingQuests);

    const { findByText } = render(QuestForm, {
        props: {
            existingQuests,
            isEdit: true,
            questId,
        },
    });

    await findByText('Unknown quest dependency');
});

test('falls back to existing quests when syncing fails', async () => {
    const existingQuests = [
        { id: 'quest-1', title: 'Quest One' },
        { id: 'quest-2', title: 'Quest Two' },
    ];
    vi.mocked(syncExistingQuestsToIndexedDB).mockRejectedValueOnce(new Error('Sync failed'));

    const { getByLabelText } = render(QuestForm, {
        props: {
            existingQuests,
            isEdit: true,
            questId: null,
        },
    });

    const requirementsSelect = getByLabelText(/Quest Requirements/i) as HTMLSelectElement;

    await waitFor(() => {
        const optionValues = Array.from(requirementsSelect.options).map((option) => option.value);
        expect(optionValues).toEqual(['quest-1', 'quest-2']);
    });
});

test('keeps selected quest requirements in create mode', async () => {
    const existingQuests = [
        { id: 'quest-1', title: 'Quest One' },
        { id: 'quest-2', title: 'Quest Two' },
    ];
    vi.mocked(syncExistingQuestsToIndexedDB).mockResolvedValueOnce(existingQuests);

    const { getByLabelText } = render(QuestForm, {
        props: {
            existingQuests,
            isEdit: false,
            questId: null,
        },
    });

    const requirementsSelect = getByLabelText(/Quest Requirements/i) as HTMLSelectElement;

    await waitFor(() => {
        expect(requirementsSelect.options).toHaveLength(2);
    });

    requirementsSelect.options[0].selected = true;
    requirementsSelect.options[1].selected = true;

    await fireEvent.change(requirementsSelect);

    await waitFor(() => {
        const selectedValues = Array.from(requirementsSelect.options)
            .filter((option) => option.selected)
            .map((option) => option.value);
        expect(selectedValues).toEqual(['quest-1', 'quest-2']);
    });
});

test('submits quest rewards with custom item IDs', async () => {
    const addSpy = vi.spyOn(db.quests, 'add').mockResolvedValueOnce('reward-quest');
    const { getByLabelText, getByText, getByTestId } = render(QuestForm);

    await fireEvent.input(getByLabelText(/Title/i), {
        target: { value: 'Reward Quest' },
    });
    await fireEvent.input(getByLabelText(/Description/i), {
        target: { value: 'A quest with a custom reward item.' },
    });

    await fireEvent.click(getByText('Add reward item'));
    await fireEvent.input(getByTestId('reward-item-id-0'), {
        target: { value: 'custom/item-alpha' },
    });
    await fireEvent.input(getByTestId('reward-item-count-0'), {
        target: { value: '2' },
    });

    const form = document.querySelector('form');
    expect(form).toBeTruthy();
    await fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
        expect(addSpy).toHaveBeenCalledTimes(1);
    });

    const questPayload = addSpy.mock.calls[0]?.[0];
    expect(questPayload.rewards).toEqual([{ id: 'custom/item-alpha', count: 2 }]);
    addSpy.mockRestore();
});

test('shows a validation error for invalid reward entries', async () => {
    const { getByLabelText, getByText, findByText } = render(QuestForm);

    await fireEvent.input(getByLabelText(/Title/i), {
        target: { value: 'Reward Validation Quest' },
    });
    await fireEvent.input(getByLabelText(/Description/i), {
        target: { value: 'A quest that validates rewards.' },
    });

    await fireEvent.click(getByText('Add reward item'));

    const form = document.querySelector('form');
    expect(form).toBeTruthy();
    await fireEvent.submit(form as HTMLFormElement);

    await findByText('Rewards require an item and positive count');
});

test('loads existing rewards when editing a quest', async () => {
    const questId = 'quest-with-reward';
    await db.quests.add({
        id: questId,
        title: 'Rewarded Quest',
        description: 'A description long enough.',
        npc: 'npc',
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'Start',
                options: [{ type: 'finish', text: 'Finish quest' }],
            },
        ],
        rewards: [{ id: 'custom/item-beta', count: 3 }],
    });

    const { getByTestId } = render(QuestForm, {
        props: {
            isEdit: true,
            questId,
        },
    });

    await waitFor(() => {
        expect((getByTestId('reward-item-id-0') as HTMLInputElement).value).toBe(
            'custom/item-beta'
        );
        expect((getByTestId('reward-item-count-0') as HTMLInputElement).value).toBe('3');
    });
});
