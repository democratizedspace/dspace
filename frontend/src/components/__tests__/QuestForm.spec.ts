import { render, fireEvent } from '@testing-library/svelte';
import QuestForm from '../svelte/QuestForm.svelte';

test('submits text then clears field', async () => {
    const { getByRole } = render(QuestForm);
    const input = getByRole('textbox');
    await fireEvent.input(input, { target: { value: 'Save the world' } });
    await fireEvent.submit(getByRole('form'));
    expect(input).toHaveValue('');
});
