import { render, fireEvent } from '@testing-library/svelte';
import ProcessForm from '../svelte/ProcessForm.svelte';

test('submits text then clears field', async () => {
    const { getByRole } = render(ProcessForm);
    const input = getByRole('textbox');
    await fireEvent.input(input, { target: { value: 'Water change' } });
    await fireEvent.submit(getByRole('form'));
    expect(input).toHaveValue('');
});
