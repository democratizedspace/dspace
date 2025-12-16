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
