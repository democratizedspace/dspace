import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';

const createProcessMock = vi.fn().mockResolvedValue('process-123');
const updateProcessMock = vi.fn().mockResolvedValue('process-123');

vi.mock('../../utils/customcontent.js', () => ({
    createProcess: (...args: unknown[]) => createProcessMock(...args),
    updateProcess: (...args: unknown[]) => updateProcessMock(...args),
}));

import ProcessForm from '../svelte/ProcessForm.svelte';

beforeEach(() => {
    createProcessMock.mockClear();
    updateProcessMock.mockClear();
});

test('submits text then clears field', async () => {
    // Render with minimal valid data
    const { getByLabelText, container } = render(ProcessForm, {
        props: {
            requireItems: [{ id: 'water', count: 1 }],
        },
    });

    const titleInput = getByLabelText('Title*');
    const durationInput = getByLabelText('Duration*');
    const form = container.querySelector('form');

    await fireEvent.input(titleInput, { target: { value: 'Water change' } });
    await fireEvent.input(durationInput, { target: { value: '1h' } });
    await fireEvent.submit(form);

    // Wait for async submission to complete and verify all fields are cleared
    await waitFor(() => {
        expect(titleInput.value).toBe('');
        expect(durationInput.value).toBe('');
    });
});

test('accepts uppercase duration units without validation errors', async () => {
    const { getByLabelText, container, queryByText } = render(ProcessForm, {
        props: {
            requireItems: [{ id: 'water', count: 1 }],
        },
    });

    const titleInput = getByLabelText('Title*');
    const durationInput = getByLabelText('Duration*');
    const form = container.querySelector('form');

    await fireEvent.input(titleInput, { target: { value: 'Caps duration' } });
    await fireEvent.input(durationInput, { target: { value: '1H 30M' } });
    await fireEvent.submit(form);

    await waitFor(() => {
        expect(queryByText('Invalid duration')).toBeNull();
        expect(titleInput.value).toBe('');
        expect(durationInput.value).toBe('');
    });
});

test('prevents duplicate submissions while save is pending', async () => {
    let resolveSave: (value: string) => void;
    const savePromise = new Promise<string>((resolve) => {
        resolveSave = resolve;
    });
    createProcessMock.mockReturnValueOnce(savePromise);

    const { getByLabelText, container, findByText } = render(ProcessForm, {
        props: {
            requireItems: [{ id: 'water', count: 1 }],
        },
    });

    const titleInput = getByLabelText('Title*');
    const durationInput = getByLabelText('Duration*');
    const form = container.querySelector('form') as HTMLFormElement;

    await fireEvent.input(titleInput, { target: { value: 'Queued Process' } });
    await fireEvent.input(durationInput, { target: { value: '1h' } });

    await fireEvent.submit(form);
    await fireEvent.submit(form);

    expect(createProcessMock).toHaveBeenCalledTimes(1);

    resolveSave('process-999');
    expect(await findByText('Process created successfully!')).toBeTruthy();
});

test('initializes edit fields from process data', async () => {
    const { getByLabelText, container } = render(ProcessForm, {
        props: {
            isEdit: true,
            processData: {
                id: 'process-200',
                title: 'Existing Process',
                duration: '45m',
                requireItems: [{ id: 'water', count: 2 }],
                consumeItems: [],
                createItems: [],
            },
        },
    });

    await waitFor(() => {
        expect(getByLabelText('Title*').value).toBe('Existing Process');
        expect(getByLabelText('Duration*').value).toBe('45m');
        const countInput = container.querySelector(
            '#required-items-section input[type="number"]'
        ) as HTMLInputElement;
        expect(countInput.value).toBe('2');
    });
});

test('normalizes missing item arrays when initializing edit data', async () => {
    const { container } = render(ProcessForm, {
        props: {
            isEdit: true,
            processData: {
                id: 'process-210',
                title: 'Normalize Items',
                duration: '15m',
                requireItems: null,
                consumeItems: undefined,
                createItems: 'invalid',
            },
        },
    });

    await waitFor(() => {
        expect(container.querySelector('#required-items-section .item-row')).toBeNull();
        expect(container.querySelector('#consumed-items-section .item-row')).toBeNull();
        expect(container.querySelector('#created-items-section .item-row')).toBeNull();
    });
});

test('submits updates in edit mode', async () => {
    const { getByLabelText, container, findByText } = render(ProcessForm, {
        props: {
            isEdit: true,
            processData: {
                id: 'process-300',
                title: 'Original',
                duration: '10m',
                requireItems: [{ id: 'water', count: 1 }],
                consumeItems: [],
                createItems: [],
            },
        },
    });

    const titleInput = getByLabelText('Title*');
    const durationInput = getByLabelText('Duration*');
    const form = container.querySelector('form') as HTMLFormElement;

    await fireEvent.input(titleInput, { target: { value: 'Updated Process' } });
    await fireEvent.input(durationInput, { target: { value: '15m' } });
    await fireEvent.submit(form);

    await waitFor(() => {
        expect(updateProcessMock).toHaveBeenCalledWith(
            'process-300',
            expect.objectContaining({
                title: 'Updated Process',
                duration: '15m',
            })
        );
        expect(createProcessMock).not.toHaveBeenCalled();
    });

    expect(await findByText('Process updated successfully!')).toBeTruthy();
});

test('uses processId prop when editing without a processData id', async () => {
    const { getByLabelText, container, findByText } = render(ProcessForm, {
        props: {
            isEdit: true,
            processId: 'process-350',
            processData: {
                title: 'Prop ID Process',
                duration: '20m',
                requireItems: [{ id: 'water', count: 1 }],
                consumeItems: [],
                createItems: [],
            },
        },
    });

    const titleInput = getByLabelText('Title*');
    const durationInput = getByLabelText('Duration*');
    const form = container.querySelector('form') as HTMLFormElement;

    await fireEvent.input(titleInput, { target: { value: 'Updated Prop ID Process' } });
    await fireEvent.input(durationInput, { target: { value: '20m' } });
    await fireEvent.submit(form);

    await waitFor(() => {
        expect(updateProcessMock).toHaveBeenCalledWith(
            'process-350',
            expect.objectContaining({
                title: 'Updated Prop ID Process',
                duration: '20m',
            })
        );
    });

    expect(await findByText('Process updated successfully!')).toBeTruthy();
});

test('shows an error when editing without a process id', async () => {
    const { getByLabelText, container, findByText } = render(ProcessForm, {
        props: {
            isEdit: true,
            requireItems: [{ id: 'water', count: 1 }],
        },
    });

    const titleInput = getByLabelText('Title*');
    const durationInput = getByLabelText('Duration*');
    const form = container.querySelector('form') as HTMLFormElement;

    await fireEvent.input(titleInput, { target: { value: 'Missing ID' } });
    await fireEvent.input(durationInput, { target: { value: '10m' } });
    await fireEvent.submit(form);

    await waitFor(() => {
        expect(updateProcessMock).not.toHaveBeenCalled();
    });

    expect(await findByText('Failed to save process. Please try again.')).toBeTruthy();
    expect(container.querySelector('.form-error')).toBeTruthy();
});

test('reinitializes edit fields after toggling edit mode', async () => {
    const { component, getByLabelText } = render(ProcessForm, {
        props: {
            isEdit: true,
            processData: {
                id: 'process-400',
                title: 'Original Title',
                duration: '10m',
                requireItems: [{ id: 'water', count: 1 }],
                consumeItems: [],
                createItems: [],
            },
        },
    });

    const titleInput = getByLabelText('Title*');

    await waitFor(() => {
        expect(titleInput.value).toBe('Original Title');
    });

    await fireEvent.input(titleInput, { target: { value: 'Modified Title' } });
    expect(titleInput.value).toBe('Modified Title');

    component.$set({ isEdit: false });
    await waitFor(() => {
        expect(titleInput.value).toBe('Modified Title');
    });

    component.$set({ isEdit: true });
    await waitFor(() => {
        expect(titleInput.value).toBe('Original Title');
    });
});

test('does not show a success link when create returns null', async () => {
    createProcessMock.mockResolvedValueOnce(null);

    const { getByLabelText, container, findByText } = render(ProcessForm, {
        props: {
            requireItems: [{ id: 'water', count: 1 }],
        },
    });

    const titleInput = getByLabelText('Title*');
    const durationInput = getByLabelText('Duration*');
    const form = container.querySelector('form') as HTMLFormElement;

    await fireEvent.input(titleInput, { target: { value: 'No Link Process' } });
    await fireEvent.input(durationInput, { target: { value: '10m' } });
    await fireEvent.submit(form);

    expect(await findByText('Process created successfully!')).toBeTruthy();
    expect(container.querySelector('.success-link')).toBeNull();
});

test('hides the preview after a successful create', async () => {
    const { getByLabelText, container, findByText } = render(ProcessForm, {
        props: {
            requireItems: [{ id: 'water', count: 1 }],
        },
    });

    const titleInput = getByLabelText('Title*');
    const durationInput = getByLabelText('Duration*');
    const form = container.querySelector('form') as HTMLFormElement;
    const previewButton = container.querySelector('button.preview-button') as HTMLButtonElement;

    await fireEvent.input(titleInput, { target: { value: 'Preview Process' } });
    await fireEvent.input(durationInput, { target: { value: '10m' } });
    await fireEvent.click(previewButton);

    expect(container.querySelector('.process-preview')).toBeTruthy();

    await fireEvent.submit(form);

    expect(await findByText('Process created successfully!')).toBeTruthy();
    expect(container.querySelector('.process-preview')).toBeNull();
});

test('shows an error when update fails', async () => {
    updateProcessMock.mockRejectedValueOnce(new Error('Update failed'));

    const { getByLabelText, container, findByText } = render(ProcessForm, {
        props: {
            isEdit: true,
            processData: {
                id: 'process-500',
                title: 'Failing Update',
                duration: '10m',
                requireItems: [{ id: 'water', count: 1 }],
                consumeItems: [],
                createItems: [],
            },
        },
    });

    const titleInput = getByLabelText('Title*');
    const durationInput = getByLabelText('Duration*');
    const form = container.querySelector('form') as HTMLFormElement;

    await fireEvent.input(titleInput, { target: { value: 'Failing Update' } });
    await fireEvent.input(durationInput, { target: { value: '10m' } });
    await fireEvent.submit(form);

    expect(await findByText('Failed to save process. Please try again.')).toBeTruthy();
    expect(container.querySelector('.form-error')).toBeTruthy();
});
