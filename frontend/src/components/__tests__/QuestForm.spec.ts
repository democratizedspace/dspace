import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { beforeEach, vi } from 'vitest';
import QuestForm from '../svelte/QuestForm.svelte';
import { db, ENTITY_TYPES } from '../../utils/customcontent.js';
import { syncExistingQuestsToIndexedDB } from '../../utils/questPersistence.js';
import { npcCatalog } from '../../data/npcs.js';

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

beforeEach(async () => {
    vi.mocked(syncExistingQuestsToIndexedDB).mockResolvedValue([]);

    const quests = await db.list(ENTITY_TYPES.QUEST);
    await Promise.all(quests.map((quest) => db.quests.delete(quest.id)));
    const processes = await db.list(ENTITY_TYPES.PROCESS);
    await Promise.all(processes.map((process) => db.processes.delete(process.id)));
});

const clearQuests = async () => {
    const quests = await db.list(ENTITY_TYPES.QUEST);
    await Promise.all(quests.map((quest) => db.quests.delete(quest.id)));
};

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

test('renders NPC select options from the catalog', () => {
    const { getByLabelText } = render(QuestForm);
    const npcSelect = getByLabelText(/NPC/i) as HTMLSelectElement;
    const optionValues = Array.from(npcSelect.options).map((option) => option.value);
    expect(optionValues).toEqual(npcCatalog.map((entry) => entry.avatar));
});

test('adds a custom NPC option when editing a quest with a legacy NPC value', async () => {
    await clearQuests();
    const questId = 'legacy-quest';
    const legacyNpc = 'Legacy NPC';
    await db.quests.add({
        id: questId,
        title: 'Legacy Quest',
        description: 'A description long enough.',
        npc: legacyNpc,
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'Start',
                options: [{ type: 'finish', text: 'Finish quest' }],
            },
        ],
    });

    const { getByLabelText } = render(QuestForm, {
        props: {
            isEdit: true,
            questId,
            existingQuests: [{ id: questId, title: 'Legacy Quest' }],
        },
    });

    const npcSelect = getByLabelText(/NPC/i) as HTMLSelectElement;

    await waitFor(() => {
        const optionValues = Array.from(npcSelect.options).map((option) => option.value);
        expect(optionValues).toContain(legacyNpc);
    });

    const customOption = Array.from(npcSelect.options).find((option) => option.value === legacyNpc);
    expect(customOption?.textContent).toBe(`Custom (${legacyNpc})`);
});

test('stores the selected NPC avatar on submit', async () => {
    await clearQuests();
    const { getByLabelText } = render(QuestForm);
    const titleInput = getByLabelText(/Title/i);
    const descriptionInput = getByLabelText(/Description/i);
    const npcSelect = getByLabelText(/NPC/i) as HTMLSelectElement;
    const form = document.querySelector('form') as HTMLFormElement;

    await fireEvent.input(titleInput, { target: { value: 'Catalog Quest' } });
    await fireEvent.input(descriptionInput, {
        target: { value: 'This description is long enough.' },
    });
    await fireEvent.change(npcSelect, { target: { value: npcCatalog[0].avatar } });
    await fireEvent.submit(form);

    await waitFor(async () => {
        const createdQuest = (await db.list(ENTITY_TYPES.QUEST)).find(
            (quest) => quest.title === 'Catalog Quest'
        );
        expect(createdQuest?.npc).toBe(npcCatalog[0].avatar);
    });

    await fireEvent.input(titleInput, { target: { value: 'Catalog Quest Two' } });
    await fireEvent.input(descriptionInput, {
        target: { value: 'Another description that is long enough.' },
    });
    await fireEvent.change(npcSelect, { target: { value: npcCatalog[2].avatar } });
    await fireEvent.submit(form);

    await waitFor(async () => {
        const createdQuest = (await db.list(ENTITY_TYPES.QUEST)).find(
            (quest) => quest.title === 'Catalog Quest Two'
        );
        expect(createdQuest?.npc).toBe(npcCatalog[2].avatar);
    });

    await fireEvent.input(titleInput, { target: { value: 'Catalog Quest Three' } });
    await fireEvent.input(descriptionInput, {
        target: { value: 'A third description that is long enough.' },
    });
    await fireEvent.change(npcSelect, { target: { value: npcCatalog[1].avatar } });
    await fireEvent.submit(form);

    await waitFor(async () => {
        const createdQuest = (await db.list(ENTITY_TYPES.QUEST)).find(
            (quest) => quest.title === 'Catalog Quest Three'
        );
        expect(createdQuest?.npc).toBe(npcCatalog[1].avatar);
    });
});

test.each([
    {
        npcValue: npcCatalog[0].avatar,
        expectedAvatar: npcCatalog[0].avatar,
        label: 'avatar',
    },
    {
        npcValue: npcCatalog[1].id,
        expectedAvatar: npcCatalog[1].avatar,
        label: 'id',
    },
    {
        npcValue: npcCatalog[2].name,
        expectedAvatar: npcCatalog[2].avatar,
        label: 'name',
    },
    {
        npcValue: '  ',
        expectedAvatar: npcCatalog[0].avatar,
        label: 'empty',
    },
])('normalizes NPC selection on edit ($label)', async ({ npcValue, expectedAvatar }) => {
    await clearQuests();
    const questId = `normalized-${String(npcValue).trim() || 'empty'}`;
    await db.quests.add({
        id: questId,
        title: 'Normalized Quest',
        description: 'A description long enough.',
        npc: npcValue,
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'Start',
                options: [{ type: 'finish', text: 'Finish quest' }],
            },
        ],
    });

    const { getByLabelText } = render(QuestForm, {
        props: {
            isEdit: true,
            questId,
            existingQuests: [{ id: questId, title: 'Normalized Quest' }],
        },
    });

    const npcSelect = getByLabelText(/NPC/i) as HTMLSelectElement;

    await waitFor(() => {
        expect(npcSelect.value).toBe(expectedAvatar);
    });
});

test.each([
    {
        label: 'id',
        npcValue: npcCatalog[1].id,
        expectedNpc: npcCatalog[1].avatar,
    },
    {
        label: 'name',
        npcValue: npcCatalog[2].name,
        expectedNpc: npcCatalog[2].avatar,
    },
    {
        label: 'custom',
        npcValue: 'Legacy NPC',
        expectedNpc: 'Legacy NPC',
    },
])(
    'stores NPC values from $label selections on submit',
    async ({ npcValue, expectedNpc, label }) => {
        await clearQuests();
        const { getByLabelText } = render(QuestForm);
        const titleInput = getByLabelText(/Title/i);
        const descriptionInput = getByLabelText(/Description/i);
        const npcSelect = getByLabelText(/NPC/i) as HTMLSelectElement;
        const form = document.querySelector('form') as HTMLFormElement;

        const customOption = document.createElement('option');
        customOption.value = npcValue;
        customOption.textContent = `Custom (${npcValue})`;
        npcSelect.appendChild(customOption);

        await fireEvent.input(titleInput, { target: { value: `Catalog Quest ${label}` } });
        await fireEvent.input(descriptionInput, {
            target: { value: 'This description is long enough.' },
        });
        await fireEvent.change(npcSelect, { target: { value: npcValue } });
        await fireEvent.submit(form);

        await waitFor(async () => {
            const createdQuest = (await db.list(ENTITY_TYPES.QUEST)).find(
                (quest) => quest.title === `Catalog Quest ${label}`
            );
            expect(createdQuest?.npc).toBe(expectedNpc);
        });
    }
);

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

test('includes custom quests in the requirements list', async () => {
    const customQuestId = 'custom-quest';
    vi.mocked(syncExistingQuestsToIndexedDB).mockResolvedValueOnce([
        { id: customQuestId, title: 'Custom Quest' },
    ]);
    const { getByLabelText } = render(QuestForm, {
        props: {
            existingQuests: [{ id: customQuestId, title: 'Custom Quest' }],
            isEdit: false,
            questId: null,
        },
    });

    const requirementsSelect = getByLabelText(/Quest Requirements/i) as HTMLSelectElement;

    await waitFor(() => {
        const optionValues = Array.from(requirementsSelect.options).map((option) => option.value);
        expect(optionValues).toEqual(expect.arrayContaining([customQuestId]));
    });
});

test('loads quests from IndexedDB when no existing quests are provided', async () => {
    const customQuestId = 'custom-db-quest';
    await db.quests.add({
        id: customQuestId,
        title: 'Indexed Quest',
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
    });

    render(QuestForm, {
        props: {
            existingQuests: [],
            isEdit: false,
            questId: null,
        },
    });

    const requirementsSelect = document.querySelector('#requires') as HTMLSelectElement | null;

    await waitFor(() => {
        const optionValues = Array.from(requirementsSelect?.options ?? []).map(
            (option) => option.value
        );
        expect(optionValues).toContain(customQuestId);
    });
});

test('handles quest load failures when no existing quests are provided', async () => {
    const originalList = db.list.bind(db);
    const listSpy = vi.spyOn(db, 'list').mockImplementation(async (entityType) => {
        if (entityType === ENTITY_TYPES.QUEST) {
            throw new Error('load failed');
        }
        return originalList(entityType);
    });

    const { getByLabelText } = render(QuestForm, {
        props: {
            existingQuests: [],
            isEdit: false,
            questId: null,
        },
    });

    const requirementsSelect = getByLabelText(/Quest Requirements/i) as HTMLSelectElement;

    await waitFor(() => {
        expect(requirementsSelect.options).toHaveLength(0);
    });

    listSpy.mockRestore();
});

test('includes custom processes in the process datalist', async () => {
    const customProcessId = 'custom-process';
    await db.processes.add({
        id: customProcessId,
        title: 'Custom Process',
        duration: 30,
    });

    vi.mocked(syncExistingQuestsToIndexedDB).mockResolvedValueOnce([]);

    render(QuestForm, {
        props: {
            existingQuests: [],
            isEdit: false,
            questId: null,
        },
    });

    await waitFor(() => {
        const datalist = document.querySelector(
            '#quest-option-process-suggestions'
        ) as HTMLDataListElement | null;
        expect(datalist).toBeTruthy();
        const optionValues = Array.from(datalist?.options ?? []).map((option) => option.value);
        expect(optionValues).toContain(customProcessId);
    });
});

test('handles item and process list failures gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const listSpy = vi.spyOn(db, 'list').mockImplementation(async (entityType) => {
        if (entityType === ENTITY_TYPES.ITEM) {
            throw new Error('Items unavailable');
        }
        if (entityType === ENTITY_TYPES.PROCESS) {
            throw new Error('Processes unavailable');
        }
        return [];
    });

    render(QuestForm, {
        props: {
            existingQuests: [],
            isEdit: false,
            questId: null,
        },
    });

    await waitFor(() => {
        const itemDatalist = document.querySelector(
            '#quest-option-item-suggestions'
        ) as HTMLDataListElement | null;
        const processDatalist = document.querySelector(
            '#quest-option-process-suggestions'
        ) as HTMLDataListElement | null;
        expect(itemDatalist?.options).toHaveLength(0);
        expect(processDatalist?.options).toHaveLength(0);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading items:', expect.any(Error));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading processes:', expect.any(Error));

    listSpy.mockRestore();
    consoleErrorSpy.mockRestore();
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
