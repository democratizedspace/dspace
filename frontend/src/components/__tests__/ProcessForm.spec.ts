import { render, fireEvent, waitFor } from '@testing-library/svelte';
import ProcessForm from '../svelte/ProcessForm.svelte';

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
