import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { vi } from 'vitest';
import ProcessForm from '../svelte/ProcessForm.svelte';

vi.mock('../../utils/customcontent.js', () => ({
    createProcess: vi.fn(async () => 123),
}));

vi.mock('../../utils/customProcessValidation.js', async () => {
    const actual = await vi.importActual('../../utils/customProcessValidation.js');
    return {
        ...actual,
        validateProcessData: vi.fn(() => ({ valid: true, errors: [] })),
    };
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

test('shows validation errors and prevents submit when invalid', async () => {
    const { getByLabelText, findByText } = render(ProcessForm, {
        props: {
            requireItems: [{ id: '', count: 0 }],
        },
    });

    const form = document.querySelector('form');
    await fireEvent.submit(form as HTMLFormElement);

    expect(await findByText('Title is required')).toBeInTheDocument();
    expect(await findByText('Invalid duration')).toBeInTheDocument();
    expect(await findByText('Item counts must be positive')).toBeInTheDocument();
});

test('renders preview when form validates', async () => {
    const { getByLabelText, getByText } = render(ProcessForm, {
        props: {
            requireItems: [{ id: 'water', count: 2 }],
        },
    });

    const titleInput = getByLabelText('Title*');
    const durationInput = getByLabelText('Duration*');

    await fireEvent.input(titleInput, { target: { value: 'Refuel Rocket' } });
    await fireEvent.input(durationInput, { target: { value: '30s' } });
    await fireEvent.click(getByText('Preview'));
    await tick();

    expect(getByText('Requires:')).toBeInTheDocument();
    expect(getByText(/Refuel Rocket/)).toBeInTheDocument();
});

test('surfaced errors when process creation fails', async () => {
    const createProcess = (await import('../../utils/customcontent.js'))
        .createProcess as unknown as ReturnType<typeof vi.fn>;
    createProcess.mockRejectedValueOnce(new Error('boom'));

    const { getByLabelText, getByText, findByRole } = render(ProcessForm, {
        props: {
            requireItems: [{ id: 'water', count: 1 }],
        },
    });

    await fireEvent.input(getByLabelText('Title*'), { target: { value: 'Test process' } });
    await fireEvent.input(getByLabelText('Duration*'), { target: { value: '10s' } });

    await fireEvent.click(getByText('Create Process'));

    const alert = await findByRole('alert');
    expect(alert.textContent).toContain('Failed to save process');
    createProcess.mockResolvedValue(42);
});
